# 🌈 Prism — Full-Stack Social Media App

A production-ready social media platform with photo posts, real-time chat, follow system, and full auth. Built with Node.js, Express, MongoDB, Socket.io, and EJS.

---

## 📁 Project Structure

```
prism/
├── config/
│   └── db.js                  # MongoDB connection
├── middleware/
│   ├── authMiddleware.js       # Session auth guards
│   └── uploadMiddleware.js     # Multer + Sharp image processing
├── models/
│   ├── User.js                 # User schema (bcrypt, follow system)
│   ├── Post.js                 # Post + comments schema
│   └── Message.js              # Chat messages schema
├── routes/
│   ├── auth.js                 # POST /signup, /login, /logout
│   ├── posts.js                # GET/POST/DELETE /api/posts, likes, comments
│   ├── users.js                # Profile, follow, search, DM history
│   └── pages.js                # Server-side page rendering
├── views/
│   ├── partials/
│   │   └── nav.ejs             # Shared sidebar nav
│   ├── signup.ejs
│   ├── login.ejs
│   ├── feed.ejs
│   ├── profile.ejs
│   ├── chat.ejs
│   └── error.ejs
├── public/
│   ├── css/main.css            # Full design system
│   ├── js/app.js               # Shared client utilities
│   └── uploads/                # Uploaded images (auto-created)
├── server.js                   # Express + Socket.io entry point
├── package.json
├── .env.example
└── .gitignore
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Auth | express-session + bcrypt (12 rounds) |
| File Upload | Multer + Sharp (WebP conversion) |
| Templating | EJS |
| Security | Helmet, express-mongo-sanitize, express-rate-limit |
| Validation | express-validator |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, **OR** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

### Step 1 — Clone / Copy the project

```bash
cd /path/to/your/projects
# If you have the zip:
unzip prism.zip && cd prism
```

---

### Step 2 — Install dependencies

```bash
npm install
```

This installs:
- `express`, `mongoose`, `socket.io`, `ejs`
- `bcrypt`, `express-session`, `connect-mongo`
- `multer`, `sharp`, `uuid`
- `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`
- `express-validator`, `dotenv`

And dev tools:
```bash
npm install nodemon --save-dev
```

---

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000

# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/prism

# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prism?retryWrites=true&w=majority

# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your-super-long-random-secret-here

NODE_ENV=development

# Max upload size in bytes (default 5MB)
MAX_FILE_SIZE=5242880
```

---

### Step 4 — Create uploads folder

```bash
mkdir -p public/uploads
```

---

### Step 5 — Start MongoDB (if running locally)

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

**Or run directly:**
```bash
mongod --dbpath /data/db
```

---

### Step 6 — Run the app

**Development (auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Open **http://localhost:3000** — you'll be redirected to the signup page automatically.

---

## 🧪 Testing Features

### Auth
1. Visit `http://localhost:3000` → redirects to `/signup`
2. Create an account (username, email, password)
3. Try signing up again with the same email → see duplicate error
4. Logout → redirected to `/login`
5. Try visiting `/feed` while logged out → redirected to `/login`

### Photo Posting
1. Click **New Post** in the sidebar or `+` on mobile
2. Drag & drop or click to select an image
3. Preview appears before posting
4. Add a caption and click **Share Post**
5. Post appears in the feed immediately
6. Like posts (heart turns red), unlike by clicking again
7. Click speech bubble to expand comments, type and press Enter to submit
8. Click 🗑 on your own posts to delete them

### Profile
1. Visit your profile via sidebar or `/profile`
2. Click **Edit Profile** → update bio, website, avatar
3. Image preview shown in modal before saving
4. Visit another user's profile → see Follow/Unfollow and Message buttons
5. Follow a user → follower count updates in real time
6. View the post grid → hover for likes/comments count, click to see detail

### Real-Time Chat
1. Open `/chat` in two browser tabs (different accounts)
2. Send a message in Global Chat → appears instantly in the other tab
3. Search for a user in the DM search box
4. Click their name to open a private conversation
5. Online status (green dot) updates in real time as users connect/disconnect
6. Chat history is persisted in MongoDB

### Security Testing
```bash
# Rate limit test (login is limited to 20 req/15min)
for i in {1..25}; do curl -X POST http://localhost:3000/login -d "email=x@x.com&password=wrong"; done

# NoSQL injection attempt (sanitized by express-mongo-sanitize)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"anything"}'

# Try to delete another user's post (should get 403)
curl -X DELETE http://localhost:3000/api/posts/SOME_POST_ID \
  -H "Cookie: connect.sid=your-session"
```

---

## 🔐 Security Overview

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt with 12 salt rounds |
| Session security | httpOnly + secure cookies, MongoStore |
| NoSQL injection | express-mongo-sanitize on all requests |
| XSS prevention | EJS auto-escaping + client-side `esc()` function |
| Rate limiting | 200 req/15min API, 20 req/15min auth routes |
| Security headers | Helmet.js (CSP, HSTS, X-Frame-Options, etc.) |
| File validation | MIME type + extension check, Sharp reprocessing |
| Auth guards | Server-side middleware on every protected route |
| Input validation | express-validator on all form inputs |
| Owner checks | All delete/edit operations verify ownership |

---

## 📡 API Reference

### Auth
```
POST /signup          { username, email, password }
POST /login           { email, password }
POST /logout
```

### Posts
```
GET  /api/posts?page=1          Feed with pagination
POST /api/posts                  Create post (multipart: image, caption)
DELETE /api/posts/:id            Delete own post
POST /api/posts/:id/like         Toggle like
POST /api/posts/:id/comment      Add comment { text }
DELETE /api/posts/:id/comment/:commentId
```

### Users
```
GET  /api/users/me               Current user
GET  /api/users/search?q=        Search users
GET  /api/users/:id              Profile + posts
PUT  /api/users/me               Update profile (multipart: avatar, bio, website)
POST /api/users/:id/follow       Toggle follow
DELETE /api/users/me             Delete account
GET  /api/users/:id/messages     DM history
GET  /api/users/global/messages  Global chat history
```

### Socket.io Events
```
Client → Server:
  global_message    { text }
  private_message   { text, receiverId }

Server → Client:
  global_message    (message object)
  private_message   (message object)
  online_users      ([{ id, username, avatar }])
```

---

## 🗄️ Database Schema

### Users
```js
{ username, email, password (hashed), avatar, bio, website,
  followers: [ObjectId], following: [ObjectId],
  isOnline, lastSeen, createdAt, updatedAt }
```

### Posts
```js
{ user: ObjectId, image, caption,
  likes: [ObjectId],
  comments: [{ user, text, createdAt }],
  createdAt, updatedAt }
```

### Messages
```js
{ sender: ObjectId, receiver: ObjectId|null, text,
  isGlobal: Boolean, readBy: [ObjectId], createdAt }
```

---

## 🌍 Deployment (Optional)

### Deploy to Railway
```bash
npm install -g @railway/cli
railway login
railway new
railway add mongodb
railway up
# Set env vars in Railway dashboard
```

### Deploy to Render
1. Push to GitHub
2. Create new **Web Service** on render.com
3. Set `npm run start` as start command
4. Add environment variables
5. Add a **MongoDB** database or connect Atlas

### Deploy to Fly.io
```bash
npm install -g flyctl
fly launch
fly secrets set SESSION_SECRET=your-secret MONGODB_URI=your-uri
fly deploy
```

### Production checklist
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `SESSION_SECRET` (64+ random bytes)
- [ ] Use MongoDB Atlas or a managed DB
- [ ] Set `secure: true` on cookies (HTTPS only)
- [ ] Configure a CDN or object storage (S3) for uploaded images
- [ ] Set up process manager (PM2): `pm2 start server.js`
- [ ] Enable HTTPS (Let's Encrypt via nginx/Caddy)

---

## 🐛 Troubleshooting

**MongoDB connection refused:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb     # macOS
sudo systemctl status mongod          # Linux
```

**Port already in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Sharp install fails (ARM Mac / Linux):**
```bash
npm install --platform=linux --arch=x64 sharp
# or
npm rebuild sharp
```

**Sessions not persisting:**
- Ensure `SESSION_SECRET` is set in `.env`
- Check MongoDB is accessible for connect-mongo to store sessions

**Images not showing:**
- Verify `public/uploads/` directory exists and is writable
- Check file permissions: `chmod 755 public/uploads`
