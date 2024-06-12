const User=require('../models/usermodels');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Order=require("../models/orderModel");
const Coupon = require('../models/couponModel')
const expressHandler = require('express-async-handler')
const flash = require('connect-flash');
const numeral = require("numeral");
const moment = require("moment")
const Product=require("../models/productModel")



//accLogin
const loadLogin=async(req,res)=>{
  try {
    res.render('./admin/pages/acclogin',{title:"Login"});
  } catch (error) {
    throw new Error(error);
  }
}

// loadDashboard---  
const loadDashboard = expressHandler(async (req, res) => {
  try {
      const messages = req.flash();
      const user = req?.user;

      // Fetch recent orders
      const recentOrders = await Order.find()
          .limit(5)
          .populate({
              path: "user",
              select: "userName image",
          })
          .select("subtotal orderDate grandTotal")
          .sort({ _id: -1 });

      // Calculate total sales amount
      let totalSalesAmount = 0;
      recentOrders.forEach((order) => {
          totalSalesAmount += order.grandTotal;
      });
      totalSalesAmount = numeral(totalSalesAmount).format("0.0a");

      // Fetch total sold products count
      const totalSoldProducts = await Product.aggregate([
          {
              $group: {
                  _id: null,
                  total_sold_count: {
                      $sum: "$sold",
                  },
              },
          },
      ]);

      // Fetch total order count and total active user count
      const totalOrderCount = await Order.countDocuments();
      const totalActiveUserCount = await User.countDocuments();

      // Fetch best selling product
      const bestSellingProduct = await Product.findOne()
          .sort({ sold: -1 })
          .limit(1);

      res.render("admin/pages/index", {
          title: "Dashboard",
          user,
          messages,
          recentOrders,
          totalOrderCount,
          totalActiveUserCount,
          totalSalesAmount,
          moment,
          totalSoldProducts: totalSoldProducts[0].total_sold_count,
          bestSellingProduct,
      });
  } catch (error) {
      throw new Error(error);
  }
});




// Login
const login = async (req, res) => {
  
  try {

    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    const emailCheck = req.body.email
   
    const user = await User.findOne({ email: emailCheck })

    if (user) {
        res.render('./admin/pages/acclogin', { adminCheck: 'You are not an Admin', title: 'Login' })
    }
    if (emailCheck === email && req.body.password === password) {

        req.session.admin = email;
        res.redirect('/admin/dashboard')
    } else {
        res.render('./admin/pages/acclogin', { adminCheck: 'Invalid Credentials', title: 'Login' })
    }

} catch (error) {
    throw new Error(error)
}
}

// UserManagement-- 
const userManagement = async (req, res) => {

  try {

      const findUsers = await User.find();

      res.render('./admin/pages/userList', { users: findUsers, title: 'UserList' })

  } catch (error) {
      throw new Error(error)
  }
}


// searchUser
const searchUser =async (req, res) => {

  try {

      const data = req.body.search
      const searching = await User.find({ userName: { $regex: data, $options: 'i' } });
      if (searching) {
          res.render('./admin/pages/userList', { users: searching, title: 'Search' })
      } else {
          res.render('./admin/pages/userList', { title: 'Search' })
      }

  } catch (error) {
      throw new Error(error)
  }
}








const useraction = async (req, res) => {
  const userID = req.query.id;
  const action = req.query.action;
  try {
    const user = await User.findById(userID);
    if (!user) {
      return res.status(400).send("user not found");
    }
    if (action === "block") {
      user.isBLock = true;
    } else if (action === "unblock") {
      user.isBLock = false;
    }
    await user.save();
    res.redirect("/admin/user");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
};
const logout = async(req,res)=>{
  try{
   
    res.redirect("/admin")
  }catch(error){
    throw new Error(error)
  }
}

//loading order page
const loadorders = async (req, res) => {
  try {
    const pageSize = 10;
    const currentPage = parseInt(req.query.page) || 1;

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / pageSize);

    const order = await Order.find()
      .populate("address")
      
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    

    res.render("./admin/pages/orderlist", {
      title: "order",
      order,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadorderdetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDetails = await Order.findById(orderId)
      .populate("address")
      .populate("products.product")
      .populate("user");
      if (!orderDetails) {
        return res.status(404).render("./admin/pages/404", { title: "404" });
      }
      res.render("./admin/pages/orderdetails", { title: "order", orderDetails });
    } catch (error) {
      console.error(error);
      res.status(404).render("./admin/pages/404", { title: "404" });
    }
  };

const OrderStatusupdate = async (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body.status;
 

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );
    res.redirect(`/admin/orderdetails/${orderId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



//cpoupon
const couponspage = expressHandler(async (req, res) => {
  try {
      const messages = req.flash();
      const coupons = await Coupon.find().sort({ _id: 1 });
      res.render("admin/pages/coupon", { title: "Coupons", coupons, messages });
  } catch (error) {
      throw new Error(error);
  }
});


//Coupon addpage---
const addCoupon = expressHandler(async (req, res) => {
  try {
      const messages = req.flash();
      res.render("admin/pages/addCoupon", { title: "Add Coupon", messages, data: {} });
  } catch (error) {
      throw new Error(error);
  }
});

//Coupan addpost---
const createCoupon = expressHandler(async (req, res) => {
  try {
      const existingCoupon = await Coupon.findOne({ code: req.body.code });

      console.log(req.body);

      if (!existingCoupon) {
          const newCoupon = await Coupon.create({
              code: req.body.code,
              type: req.body.type,
              value: parseInt(req.body.value),
              description: req.body.description,
              expiryDate: req.body.expiryDate,
              minAmount: parseInt(req.body.minAmount),
              maxAmount: parseInt(req.body.maxAmount) || 0,
          });
          res.redirect("/admin/coupon");
      }
      req.flash("warning", "Coupon exists with same code");
      const messages = req.flash()
      res.render("admin/pages/addCoupon", { title: "Add Coupon", messages, data: req.body });
  } catch (error) {
      throw new Error(error);
  }
});

//coupon edit---
const editCouponPage = expressHandler(async (req, res) => {
  try {
      const couponId = req.params.id;
      const coupon = await Coupon.findById(couponId);
      const couponTypes = await Coupon.distinct("type");
      const messages = req.flash();
      res.render("admin/pages/editCoupon", { title: "Edit Coupon", coupon, couponTypes, messages });
  } catch (error) {
      throw new Error(error);
  }
});
/**
* Update Coupon
* Method POST
*/
const updateCoupon = expressHandler(async (req, res) => {
  try {
      const couponId = req.params.id;
      const isExists = await Coupon.findOne({ code: req.body.code, _id: { $ne: couponId } });

      if (!isExists) {
          const updtedCoupon = await Coupon.findByIdAndUpdate(couponId, req.body);
          req.flash("success", "Coupon Updated");
          res.redirect("/admin/coupon");
      } else {
          req.flash("warning", "Coupon Already Exists");
          res.redirect("back");
      }
  } catch (error) { }
});


const salesReportpage = expressHandler(async (req, res) => {
  try {
      res.render("admin/pages/salesreport", { title: "Sales Report" });
  } catch (error) {
      throw new Error(error);
  }
});

const getSalesData = async (req, res) => {
  try {
      const pipeline = [
          {
              $project: {
                  year: { $year: "$orderDate" },
                  month: { $month: "$orderDate" },
                  grandTotal: 1,
              },
          },
          {
              $group: {
                  _id: { year: "$year", month: "$month" },
                  totalSales: { $sum: "$grandTotal" },
              },
          },
          {
              $project: {
                  _id: 0,
                  month: {
                      $concat: [
                          { $toString: "$_id.year" },
                          "-",
                          {
                              $cond: {
                                  if: { $lt: ["$_id.month", 10] },
                                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                                  else: { $toString: "$_id.month" },
                              },
                          },
                      ],
                  },
                  sales: "$totalSales",
              },
          },
      ];

      const monthlySalesArray = await Order.aggregate(pipeline);
     console.log(monthlySalesArray)

      res.json(monthlySalesArray);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};



const getSalesDataYearly = async (req, res) => {
  try {
      const yearlyPipeline = [
          {
            $project: {
              year: { $year: "$orderDate" },
              grandTotal: 1,
            },
          },
          {
            $group: {
              _id: { year: "$year" },
              totalSales: { $sum: "$grandTotal" },
            },
          },
          {
            $project: {
              _id: 0,
              year: { $toString: "$_id.year" },
              sales: "$totalSales",
            },
          },
        ];
        

      const yearlySalesArray = await Order.aggregate(yearlyPipeline);
      console.log(yearlySalesArray)
      res.json(yearlySalesArray);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};


/**
* get sales data weekly
* method get
*/
const getSalesDataWeekly =async (req, res) => {
  try {
      const weeklySalesPipeline = [
          {
            $project: {
              week: { $week: "$orderDate" },
              grandTotal: 1,
            },
          },
          {
              $group: {
                  _id: { week: { $mod: ["$week", 7] } },
                  totalSales: { $sum: "$grandTotal" },
                },
          },
          {
            $project: {
              _id: 0,
              week: { $toString: "$_id.week" },
              dayOfWeek: { $add: ["$_id.week", 1] },
              sales: "$totalSales",
            },
          },
          {
              $sort: { dayOfWeek: 1 },
            },
      ];
        

      const weeklySalesArray = await Order.aggregate(weeklySalesPipeline);
      console.log(weeklySalesArray);

      res.json(weeklySalesArray);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};

const pagenation = async (req, res) => {
  const start = parseInt(req.body.start);
  const length = parseInt(req.body.length);
  const searchValue = req.body.search.value;

  const query = searchValue ? { $text: { $search: searchValue } } : {};

  const orders = await Order.find(query)
    .populate('address') 
    .skip(start)
    .limit(length)
    .sort({ orderDate: -1 })
    .exec();

  const recordsTotal = await Order.countDocuments({});
  const recordsFiltered = searchValue ? await Order.countDocuments(query) : recordsTotal;

  const data = orders.map(order => ({
    _id: order._id,
    user_name: order.address?.user_name,
    phone: order.address?.phone,
    grandTotal: order.grandTotal,
    status: `<span class="badge2 rounded-pill alert-warning">${order.status}</span>`,
    orderDate: order.orderDate.toLocaleString(),
    action: `<a class="btn btn-sm btn-primary" href="/admin/orderdetails/${order._id}">Details</a>`
  }));

  res.json({
    draw: req.body.draw,
    recordsTotal: recordsTotal,
    recordsFiltered: recordsFiltered,
    data: data
  });
};



module.exports={
  loadLogin,
  login,
  loadDashboard,
  userManagement,
  searchUser,
  useraction ,
  logout,
  loadorderdetails,
  OrderStatusupdate,
  loadorders,
  couponspage,
  addCoupon,
  createCoupon,
  editCouponPage,
  updateCoupon,
  getSalesDataWeekly,
  getSalesData ,
  getSalesDataYearly,
  salesReportpage,
  pagenation
  
 
}