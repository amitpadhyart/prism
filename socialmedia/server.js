require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { loadUser } = require('./middleware/authMiddleware');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

// Connect DB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  }
}));
app.use(mongoSanitize());
app.use(cors());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts, please try again later' });
app.use('/api/', limiter);
app.use('/login', authLimiter);
app.use('/signup', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load user on every request
app.use(loadUser);

// Routes
app.use('/', require('./routes/pages'));
app.use('/', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { title: '404', message: 'Page not found', code: 404 });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
  res.status(status).render('error', { title: 'Error', message: err.message || 'Server error', code: status });
});

// ─── Socket.io ─────────────────────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> { socketId, username, avatar }

io.use(async (socket, next) => {
  const sessionId = socket.handshake.auth.sessionId;
  const userId = socket.handshake.auth.userId;
  if (!userId) return next(new Error('Unauthorized'));
  try {
    const user = await User.findById(userId).select('username avatar');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Auth error'));
  }
});

io.on('connection', async (socket) => {
  const user = socket.user;
  onlineUsers.set(user._id.toString(), { socketId: socket.id, username: user.username, avatar: user.avatar });

  await User.findByIdAndUpdate(user._id, { isOnline: true });
  io.emit('online_users', Array.from(onlineUsers.entries()).map(([id, u]) => ({ id, ...u })));

  // Global chat
  socket.on('global_message', async (data) => {
    if (!data.text?.trim()) return;
    try {
      const msg = await Message.create({
        sender: user._id,
        text: data.text.trim().substring(0, 1000),
        isGlobal: true
      });
      const populated = await msg.populate('sender', 'username avatar');
      io.emit('global_message', populated);
    } catch (err) {
      console.error('Socket global_message error:', err);
    }
  });

  // Private message
  socket.on('private_message', async (data) => {
    if (!data.text?.trim() || !data.receiverId) return;
    try {
      const msg = await Message.create({
        sender: user._id,
        receiver: data.receiverId,
        text: data.text.trim().substring(0, 1000),
        isGlobal: false
      });
      const populated = await msg.populate('sender', 'username avatar');
      const receiverSocket = onlineUsers.get(data.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('private_message', populated);
      }
      socket.emit('private_message', populated);
    } catch (err) {
      console.error('Socket private_message error:', err);
    }
  });

  socket.on('disconnect', async () => {
    onlineUsers.delete(user._id.toString());
    await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
    io.emit('online_users', Array.from(onlineUsers.entries()).map(([id, u]) => ({ id, ...u })));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = { app, server };
