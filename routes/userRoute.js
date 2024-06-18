const express=require('express');
const userRoute=express.Router();
const userController=require('../controllers/usercontroller');
const userAuth=require('../middleware/userAuth')
const setErrorMessage = require('../middleware/errormsg');
const addressControl=require('../controllers/addressControl')
const cartController=require('../controllers/cartControler');

const wishlistController = require('../controllers/wishlistControl');
const path = require('path');
const orderController = require('../controllers/orderController');



userRoute.use(setErrorMessage);


userRoute.use((req, res, next) => {
  req.app.set('layout', 'user/layout/user');
  
  next();
})


userRoute.get('/',userController.loadlandingpage)
userRoute.get('/login',userController.loadloginpage);
userRoute.get('/userprofile',userController.loaduserprofile);
userRoute.post('/userprofile',userController.editProfilePost);


userRoute.get('/registration',userController.loadregistration);
userRoute.get('/logout',userController.logout);

userRoute.post('/registration',userController.register);
userRoute.post('/login',userController.login);
userRoute.get('/about',userController.loadaboutpage);
userRoute.get('/shop',userController.loadshoppage);

userRoute.get('/contact',userController.loadcontactpage);
userRoute.get('/product',userController.loadproductdetailspage);
userRoute.get('/login',userAuth.isLogout,userController.loadloginpage);
userRoute.get('/',userAuth.isLogin,userController.loadlandingpage)

userRoute.get('/otp',userController.sendOTPpage);
userRoute.post('/otp',userController.verifyOTP);
userRoute.get('/reSendOTP', userController.reSendOTP); /* otp Resending */
userRoute.post('/reSendOTP', userController.verifyResendOTP);



// cart management
// userRoute.get('/cart', cartController.cartPage);
// userRoute.get('/add/:id', cartController.addToCart);
// userRoute.get('/remove/:id', cartController.removeFromCart);
// userRoute.get('/cart/inc/:id', cartController.incQuantity);
// userRoute.get('/cart/dec/:id', cartController.decQuantity);

// Add to Cart
// Add to Cart
// Add to Cart
userRoute.get(
  "/shopingcart",
  userAuth.isLogin,
  cartController.loadshopcartpage
);
userRoute.post("/shopingcart",userAuth.isLogin, cartController.addToCart);
userRoute.get("/removecart",userAuth.isLogin, cartController.removeProduct);

//update cart
userRoute.post("/updateCart", userAuth.isLogin, cartController.updateCart);



//forgot password
userRoute.get('/forget',userAuth.isLogout,userController.forgetLoad)
userRoute.post('/forget', userAuth.isLogout,userController.forgetpswd)
userRoute.get('/forget-password',userAuth.isLogout,userController.forgetPswdload);
userRoute.post('/forget-password',userAuth.isLogout, userController.resetPswd)

//ADDRESS
userRoute.get('/address', userAuth.isLogin,addressControl.getAllAddress )
userRoute.get('/addAddress', userAuth.isLogin, addressControl.addAddressPage)
userRoute.post('/addAddress', userAuth.isLogin, addressControl.newAddress)
userRoute.get('/editAddress', userAuth.isLogin,addressControl.editAddressPage);
userRoute.post('/editAddress', userAuth.isLogin,addressControl.editAddress);
userRoute.get('/deltAddress/:id', userAuth.isLogin,addressControl.deleteAddress);

//reset password
userRoute.get('/reset', userAuth.isLogin,userController.loadResetpage )
userRoute.post('/reset', userAuth.isLogin,userController.UpdatePassword )


//checkOut
userRoute.get('/checkOut',userAuth.isLogin,cartController.loadcheckoutpage);


//orders

console.log(orderController,"ordercontroller is");
userRoute.post("/confirm-order",orderController.confirmOrder);

userRoute.get("/orderList", userAuth.isLogin, orderController.loadorderspage);
userRoute.get("/orderDetailing", orderController.loadorderDetailing);
// userRoute.get("/cancelOrder/:id", orderController.cancelOrder);
userRoute.post("/cancelSingleOrder", orderController.cancelOrderById);
userRoute.post("/returnSingleOrder", orderController.returnOrderById);
userRoute.get("/orders/download/:id", orderController.donwloadInvoice);


userRoute.post('/verify-payment',userAuth.isLogin,orderController.verifyPayment);


//wishlist
userRoute.get("/loadwishlist", userAuth.isLogin,wishlistController.loadwishlistpage);
userRoute.get("/addToWishlist/:productId", userAuth.isLogin,wishlistController.addToWishlist);
userRoute.post("/removewishlist",userAuth.isLogin, wishlistController.removewishlist);

//wallet
userRoute.get('/wallet',userAuth.isLogin,userController.loadwalletpage);
userRoute.get("/wallets",userAuth.isLogin, userController.walletTransactionspage);

//coupon
userRoute.post('/apply-coupon',userAuth.isLogin,orderController.applyCoupon);
userRoute.get("/coupon/remove", userAuth.isLogin, orderController.removeAppliedCoupon);






module.exports=userRoute;        