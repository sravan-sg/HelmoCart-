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

module.exports = {
  isLogin,
  isLogout
};