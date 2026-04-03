const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/authMiddleware');
const { upload, processImage, deleteFile } = require('../middleware/uploadMiddleware');

// GET /api/posts - feed with pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar')
      .lean();

    const total = await Post.countDocuments();

    res.json({
      success: true,
      posts: posts.map(p => ({
        ...p,
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
        isLiked: p.likes.some(id => id.toString() === req.user._id.toString()),
        isOwner: p.user._id.toString() === req.user._id.toString()
      })),
      hasMore: skip + limit < total,
      currentPage: page
    });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ success: false, message: 'Error loading posts' });
  }
});

// POST /api/posts - create post
router.post('/', requireAuth, upload.single('image'), processImage(1200, 1200), [
  body('caption').optional().trim().isLength({ max: 2200 })
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const post = await Post.create({
      user: req.user._id,
      image: req.file.filename,
      caption: req.body.caption || ''
    });

    await post.populate('user', 'username avatar');
    res.status(201).json({ success: true, post });
  } catch (err) {
    if (req.file) deleteFile(req.file.filename);
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: 'Error creating post' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    deleteFile(post.image);
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const idx = post.likes.indexOf(req.user._id);
    let liked;
    if (idx > -1) {
      post.likes.splice(idx, 1);
      liked = false;
    } else {
      post.likes.push(req.user._id);
      liked = true;
    }
    await post.save();
    res.json({ success: true, liked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', requireAuth, [
  body('text').trim().notEmpty().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();
    await post.populate('comments.user', 'username avatar');

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
});

// DELETE /api/posts/:id/comment/:commentId
router.delete('/:id/comment/:commentId', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post.user.toString() === req.user._id.toString();
    if (!isOwner && !isPostOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    comment.deleteOne();
    await post.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
});

module.exports = router;
