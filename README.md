<div align="center">
 
<br/>
 
```
██████╗ ██████╗ ██╗███████╗███╗   ███╗
██╔══██╗██╔══██╗██║██╔════╝████╗ ████║
██████╔╝██████╔╝██║███████╗██╔████╔██║
██╔═══╝ ██╔══██╗██║╚════██║██║╚██╔╝██║
██║     ██║  ██║██║███████║██║ ╚═╝ ██║
╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚═╝     ╚═╝
```
 
**A production-ready full-stack social media platform**
 
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
 
[Features](#-features) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Security](#-security) · [Schema](#-database-schema)
 
<br/>
 
</div>
 
---
 
## ✨ Features
 
| Feature | Details |
|---|---|
| 📸 **Photo Posts** | Drag-and-drop upload, image preview, captions, like & comment |
| 💬 **Real-Time Chat** | Global room + private DMs via Socket.io, persisted in MongoDB |
| 👥 **Social Graph** | Follow/unfollow, follower counts, profile pages with post grid |
| 🔐 **Auth** | Signup/login with bcrypt hashing, session-based auth, rate limiting |
| 🛡️ **Security** | Helmet, NoSQL injection prevention, XSS protection, input validation |
| 🖼️ **Image Processing** | Multer + Sharp → auto-converts all uploads to optimized WebP |
| 🔍 **User Search** | Live search with instant results |
 
---
 
## 📁 Project Structure
 
```
prism/
├── config/
│   └── db.js                   # MongoDB connection
├── middleware/
│   ├── authMiddleware.js        # Session auth guards
│   └── uploadMiddleware.js      # Multer + Sharp image processing
├── models/
│   ├── User.js                  # User schema (bcrypt, follow system)
│   ├── Post.js                  # Post + comments schema
│   └── Message.js               # Chat messages schema
├── routes/
│   ├── auth.js                  # POST /signup, /login, /logout
│   ├── posts.js                 # CRUD /api/posts, likes, comments
│   ├── users.js                 # Profile, follow, search, DMs
│   └── pages.js                 # Server-side page rendering
├── views/
│   ├── partials/nav.ejs         # Shared sidebar nav
│   ├── signup.ejs
│   ├── login.ejs
│   ├── feed.ejs
│   ├── profile.ejs
│   ├── chat.ejs
│   └── error.ejs
├── public/
│   ├── css/main.css             # Full design system
│   ├── js/app.js                # Shared client utilities
│   └── uploads/                 # Uploaded images (auto-created)
├── server.js                    # Express + Socket.io entry point
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
 
- **[Node.js 18+](https://nodejs.org/)**
- **MongoDB** — [local install](https://www.mongodb.com/try/download/community) **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
 
---
 
### 1 — Clone the repo
 
```bash
git clone https://github.com/your-username/prism.git
cd prism
```
 
### 2 — Install dependencies
 
```bash
npm install
npm install nodemon --save-dev
```
 
### 3 — Configure environment
 
```bash
cp .env.example .env
```
 
Open `.env` and fill in your values:
 
```env
PORT=3000
 
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/prism
 
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prism
 
# Generate a strong secret:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your-super-long-random-secret-here
 
NODE_ENV=development
 
# Max upload size in bytes (default 5 MB)
MAX_FILE_SIZE=5242880
```
 
### 4 — Create the uploads directory
 
```bash
mkdir -p public/uploads
```
 
### 5 — Start MongoDB (local installs only)
 
```bash
# macOS (Homebrew)
brew services start mongodb-community
 
# Ubuntu/Debian
sudo systemctl start mongod
 
# Windows
net start MongoDB
 
# Or run directly
mongod --dbpath /data/db
```
 
### 6 — Run the app
 
```bash
# Development (auto-reload)
npm run dev
 
# Production
npm start
```
 
Open **http://localhost:3000** — you'll be redirected to the signup page automatically.
 
---
 
## 🧪 Testing the Features
 
<details>
<summary><strong>Auth flow</strong></summary>
 
1. Visit `http://localhost:3000` → redirects to `/signup`
2. Create an account (username, email, password)
3. Try signing up again with the same email → see duplicate error
4. Logout → redirected to `/login`
5. Visit `/feed` while logged out → redirected to `/login`
 
</details>
 
<details>
<summary><strong>Photo posting</strong></summary>
 
1. Click **New Post** in the sidebar (or `+` on mobile)
2. Drag & drop or click to select an image
3. Preview appears before posting
4. Add a caption and click **Share Post**
5. Post appears in the feed immediately
6. Like posts (heart turns red), unlike by clicking again
7. Click the speech bubble to expand comments — press Enter to submit
8. Click 🗑 on your own posts to delete them
 
</details>
 
<details>
<summary><strong>Profiles & following</strong></summary>
 
1. Visit your profile via the sidebar or `/profile`
2. Click **Edit Profile** → update bio, website, and avatar
3. Image preview shown in modal before saving
4. Visit another user's profile → see **Follow / Unfollow** and **Message** buttons
5. Follow a user → follower count updates in real time
6. Hover over the post grid to see likes/comment count; click for detail view
 
</details>
 
<details>
<summary><strong>Real-time chat</strong></summary>
 
1. Open `/chat` in two browser tabs (different accounts)
2. Send a message in **Global Chat** → appears instantly in the other tab
3. Search for a user in the DM search box, click their name to open a private thread
4. Online status (green dot) updates in real time as users connect/disconnect
5. All chat history is persisted in MongoDB
 
</details>
 
<details>
<summary><strong>Security smoke tests</strong></summary>
 
```bash
# Rate limit test — login is capped at 20 req / 15 min
for i in {1..25}; do
  curl -X POST http://localhost:3000/login -d "email=x@x.com&password=wrong"
done
 
# NoSQL injection attempt — sanitized by express-mongo-sanitize
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"anything"}'
 
# Attempt to delete another user's post — expect 403
curl -X DELETE http://localhost:3000/api/posts/SOME_POST_ID \
  -H "Cookie: connect.sid=your-session"
```
 
</details>
 
---
 
## 📡 API Reference
 
### Auth
 
```
POST /signup        { username, email, password }
POST /login         { email, password }
POST /logout
```
 
### Posts
 
```
GET    /api/posts?page=1              Paginated feed
POST   /api/posts                     Create post  (multipart: image, caption)
DELETE /api/posts/:id                 Delete own post
POST   /api/posts/:id/like            Toggle like
POST   /api/posts/:id/comment         Add comment  { text }
DELETE /api/posts/:id/comment/:cid    Delete comment
```
 
### Users
 
```
GET    /api/users/me                  Current user
GET    /api/users/search?q=           Search users
GET    /api/users/:id                 Profile + posts
PUT    /api/users/me                  Update profile  (multipart: avatar, bio, website)
POST   /api/users/:id/follow          Toggle follow
DELETE /api/users/me                  Delete account
GET    /api/users/:id/messages        DM history
GET    /api/users/global/messages     Global chat history
```
 
### Socket.io Events
 
| Direction | Event | Payload |
|---|---|---|
| Client → Server | `global_message` | `{ text }` |
| Client → Server | `private_message` | `{ text, receiverId }` |
| Server → Client | `global_message` | message object |
| Server → Client | `private_message` | message object |
| Server → Client | `online_users` | `[{ id, username, avatar }]` |
 
---
 
## 🔐 Security
 
| Concern | Implementation |
|---|---|
| Password storage | bcrypt with 12 salt rounds |
| Session security | `httpOnly` + `secure` cookies, MongoStore |
| NoSQL injection | express-mongo-sanitize on all requests |
| XSS prevention | EJS auto-escaping + client-side `esc()` helper |
| Rate limiting | 200 req / 15 min (API) · 20 req / 15 min (auth) |
| Security headers | Helmet.js — CSP, HSTS, X-Frame-Options, etc. |
| File validation | MIME type + extension check, Sharp reprocessing |
| Auth guards | Server-side middleware on every protected route |
| Input validation | express-validator on all form inputs |
| Ownership checks | All delete/edit operations verify resource ownership |
 
---
 
## 🗄️ Database Schema
 
<details>
<summary><strong>User</strong></summary>
 
```js
{
  username:  String,
  email:     String,
  password:  String,          // bcrypt hash
  avatar:    String,
  bio:       String,
  website:   String,
  followers: [ObjectId],
  following: [ObjectId],
  isOnline:  Boolean,
  lastSeen:  Date,
  createdAt: Date,
  updatedAt: Date
}
```
 
</details>
 
<details>
<summary><strong>Post</strong></summary>
 
```js
{
  user:     ObjectId,
  image:    String,
  caption:  String,
  likes:    [ObjectId],
  comments: [{ user: ObjectId, text: String, createdAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```
 
</details>
 
<details>
<summary><strong>Message</strong></summary>
 
```js
{
  sender:   ObjectId,
  receiver: ObjectId | null,  // null = global message
  text:     String,
  isGlobal: Boolean,
  readBy:   [ObjectId],
  createdAt: Date
}
```
 
</details>
 
