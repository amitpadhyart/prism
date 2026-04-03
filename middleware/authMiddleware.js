const User = require('../models/User');

// Protect routes - require login
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    return res.redirect('/login');
  }
  next();
};

// Attach user to request if logged in
const loadUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
      } else {
        req.session.destroy();
      }
    } catch (err) {
      console.error('Load user error:', err);
    }
  }
  next();
};

// Redirect to feed if already logged in
const redirectIfAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/feed');
  }
  next();
};

module.exports = { requireAuth, loadUser, redirectIfAuth };
