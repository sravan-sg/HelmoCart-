const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      // User is logged in, allow the request to proceed
      return next();
    } else {
      // User is not logged in, redirect to login page
      return res.redirect('/login');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      // User is logged in, redirect to homepage
      return res.redirect('/');
    } else {
      // User is not logged in, allow the request to proceed
      return next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.session.user_id) {
    res.locals.isAuthenticated = true;
    res.locals.user = req.session.user_id;
  } else {
    res.locals.isAuthenticated = false;
    res.locals.user = null;
  }
  next();
};


module.exports = {
  isLogin,
  isLogout,
  isAuthenticated
};