const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuth } = require('../middleware/authMiddleware');

router.get('/', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/feed');
  res.redirect('/signup');
});

router.get('/feed', requireAuth, (req, res) => {
  res.render('feed', { title: 'Feed' });
});

router.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { title: 'My Profile', profileId: req.user._id.toString() });
});

router.get('/profile/:id', requireAuth, (req, res) => {
  res.render('profile', { title: 'Profile', profileId: req.params.id });
});

router.get('/chat', requireAuth, (req, res) => {
  res.render('chat', { title: 'Messages' });
});

module.exports = router;
