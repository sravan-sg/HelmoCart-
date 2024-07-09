const express=require('express');
const adminRoute=express.Router();
const admincontroller=require('../controllers/admincontroller');
const categoryController = require('../controllers/categorycontrol')
const adminAuth=require('../middleware/adminAuth')
const productController = require('../controllers/productControl')


const { upload } = require('../config/upload')
require('dotenv').config()


adminRoute.use((req, res, next) => {
  req.app.set('layout', 'admin/layout/admin');
  
  next();
})


adminRoute.get('/',admincontroller.loadLogin);
adminRoute.post('/',adminAuth.isLogin,admincontroller.login);
adminRoute.get('/dashboard',admincontroller.loadDashboard);

adminRoute.get('/logout', admincontroller.logout);


// //userManagement
adminRoute.get('/user', admincontroller.userManagement)
adminRoute.post('/user/search', admincontroller.searchUser)
// adminRoute.post('/user/blockUser/:userId', admincontroller.blockUser)
// adminRoute.post('/user/unBlockUser/:id', admincontroller.unBlockUser)
adminRoute.get("/useractions", admincontroller.useraction);


// categoryManagement--- 
adminRoute.get('/category',categoryController.categoryManagement)
adminRoute.get('/addCategory', categoryController.addCategory)
adminRoute.post('/addCategory', categoryController.insertCategory)
adminRoute.get('/category/list/:id', categoryController.list)
adminRoute.get('/category/unList/:id', categoryController.unList)
adminRoute.get('/editCategory/:id', categoryController.editCategory)
adminRoute.post('/editCategory/:id',categoryController.updateCategory)
adminRoute.post('/category/search',categoryController.searchCategory)

// // Product Management---

adminRoute.get('/product', productController.productManagement)
adminRoute.get('/product/addProduct', productController.addProduct)
adminRoute.post('/product/addProduct',
    upload.fields([
        { name: "secondaryImage",maxCount:3 }
        , { name: "primaryImage" ,}]),
    productController.insertProduct)  /** Product adding and multer using  **/

adminRoute.post('/product/list/:id', productController.listProduct)
adminRoute.post('/product/unList/:id', productController.unListProduct)
adminRoute.get('/product/editproduct/:id', productController.editProductPage)
adminRoute.post('/product/editproduct/:id',
    upload.fields([
        { name: "secondaryImage",maxCount:4 }
        ,{ name: "primaryImage",maxCount:3 }]),
    productController.updateProduct)
    adminRoute.post('/deleteImage/:productId/:imageName',adminAuth.isLogin, productController. deleteImage)


// // OrderManagement--
adminRoute.get("/orders", admincontroller.loadorders);
adminRoute.get("/orderdetails/:id", admincontroller.loadorderdetails);
adminRoute.post("/orderdetails/:id", admincontroller.OrderStatusupdate);
adminRoute.post("/orderpage", admincontroller.pagenation);


//coupon management
adminRoute.get("/coupon", admincontroller.couponspage);
adminRoute.get("/coupon/add", admincontroller.addCoupon);
adminRoute.get("/coupon/edit/:id", admincontroller.editCouponPage);
adminRoute.post("/coupon/add", admincontroller.createCoupon);
adminRoute.post("/coupon/edit/:id", admincontroller.updateCoupon);


//salesreport
adminRoute.get("/salesreport", admincontroller.salesReportpage);
adminRoute.get("/sales-data/weekly", admincontroller.getSalesDataWeekly);
adminRoute.get("/sales-data/yearly", admincontroller.getSalesDataYearly);
adminRoute.get("/sales-data", admincontroller.getSalesData);


module.exports=adminRoute;