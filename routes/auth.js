const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { redirectIfAuth } = require('../middleware/authMiddleware');

// GET /signup
router.get('/signup', redirectIfAuth, (req, res) => {
  res.render('signup', { title: 'Create Account', error: null });
});

// POST /signup
router.post('/signup', redirectIfAuth, [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores'),
  body('email')
    .isEmail().withMessage('Enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('signup', { title: 'Create Account', error: errors.array()[0].msg });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.render('signup', { title: 'Create Account', error: `${field} already in use` });
    }

    const user = await User.create({ username, email, password });
    req.session.userId = user._id;
    req.session.save(() => res.redirect('/feed'));
  } catch (err) {
    console.error('Signup error:', err);
    res.render('signup', { title: 'Create Account', error: 'Something went wrong. Please try again.' });
  }
});

// GET /login
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('login', { title: 'Sign In', error: null });
});

// POST /login
router.post('/login', redirectIfAuth, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('login', { title: 'Sign In', error: 'Invalid email or password' });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { title: 'Sign In', error: 'Invalid email or password' });
    }

    req.session.userId = user._id;
    req.session.save(() => res.redirect('/feed'));
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { title: 'Sign In', error: 'Something went wrong. Please try again.' });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
});

module.exports = router;
