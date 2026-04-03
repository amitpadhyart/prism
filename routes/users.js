const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/authMiddleware');
const { upload, processImage, deleteFile } = require('../middleware/uploadMiddleware');

// GET /api/users/search
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('username avatar bio').limit(10);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search error' });
  }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'username avatar').populate('following', 'username avatar');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).populate('user', 'username avatar').lean();

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing: user.followers.some(f => f._id.toString() === req.user._id.toString()),
        isMe: user._id.toString() === req.user._id.toString()
      },
      posts: posts.map(p => ({
        ...p,
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
        isLiked: p.likes.some(id => id.toString() === req.user._id.toString()),
        isOwner: true
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error loading profile' });
  }
});

// PUT /api/users/me - update profile
router.put('/me', requireAuth, upload.single('avatar'), processImage(400, 400, 90), [
  body('bio').optional().trim().isLength({ max: 200 }),
  body('website').optional().trim().isURL().optional({ nullable: true, checkFalsy: true }),
], async (req, res) => {
  try {
    const updates = {};
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;

    if (req.file) {
      if (req.user.avatar) deleteFile(req.user.avatar);
      updates.avatar = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    if (req.file) deleteFile(req.file.filename);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', requireAuth, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Can't follow yourself" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = target.followers.includes(req.user._id);
    if (isFollowing) {
      target.followers.pull(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: target._id } });
    } else {
      target.followers.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $push: { following: target._id } });
    }
    await target.save();

    res.json({ success: true, isFollowing: !isFollowing, followersCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating follow' });
  }
});

// DELETE /api/users/me - delete account
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id });
    for (const post of posts) deleteFile(post.image);
    await Post.deleteMany({ user: req.user._id });

    if (req.user.avatar) deleteFile(req.user.avatar);
    await User.findByIdAndDelete(req.user._id);
    await Message.deleteMany({ $or: [{ sender: req.user._id }, { receiver: req.user._id }] });

    req.session.destroy();
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting account' });
  }
});

// GET /api/users/:id/messages - DM history
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.id },
        { sender: req.params.id, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 }).populate('sender', 'username avatar').limit(100);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error loading messages' });
  }
});

// GET /api/users/global/messages - global chat history
router.get('/global/messages', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ isGlobal: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username avatar');

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error loading messages' });
  }
});

module.exports = router;
