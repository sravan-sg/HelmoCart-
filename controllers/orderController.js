const Product = require("../models/productModel");
const User = require("../models/usermodels");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const { verifyOrderPayment } = require("../helper/razorpay");
const Razorpay = require("razorpay");
const Wallet = require("../models/walletModel");
const moment = require("moment")
const { generateInvoice } = require('../helper/orderHelper');
const pdfMake = require("pdfmake/build/pdfmake");
const vfsFonts = require("pdfmake/build/vfs_fonts");
const Coupon=require("../models/couponModel");
const WalletTransaction =require("../models/walletTransactionModel");

require('dotenv').config();
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});


const loadorderDetailing = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const orderId = req.query.id;
   
    
    const orderDetails = await Order.find({ user: userId, _id: orderId })
      .populate({
        path: "products.product",
        select: "title primaryImage",
      })
      .populate("address")
      .exec();
      orderDetails.forEach(orderDetail => {
        orderDetail.formattedOrderDate = moment(orderDetail.orderDate).format('MMMM Do YYYY, h:mm:ss a');
      });
      
    if (!orderDetails) {
      return res.status(404).send("Order details not found");
    }

    res.render("./user/pages/orderDetails", { orderDetails, user,orderDetails });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadorderspage = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
    const user = await User.findById(userId)
    
   
  try {
    const orderdetails = await Order.find({ user: userId });

    res.render("user/pages/orders", { user, orderdetails});
    console.log(orderdetails,'order detaaailssssss');
  } catch (error) {
    console.log(error);
  }
});



const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user_id;

    // Find the coupon
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(400).json({ error: "Invalid coupon code." });
    }

    // Check if the coupon is expired
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({ error: "Coupon code has expired." });
    }

    // Check if the coupon has already been used by the user
    if (coupon.usedBy.includes(userId)) {
      return res.status(400).json({ error: "You have already used this coupon." });
    }

    // Calculate the discount
    const cart = await Cart.findOne({ user_id: userId }).populate("products.productId");
    let discount = 0;

    if (coupon.type === "percentage") {
      discount = (coupon.value / 100) * cart.total;
    } else if (coupon.type === "fixed") {
      discount = coupon.value;
    }

    if (discount > coupon.maxAmount) {
      discount = coupon.maxAmount;
    }
    req.session.discount = discount;

    const newTotal = cart.total - discount;
    console.log(newTotal,"new total after discount");
    res.status(200).json({ discount, newTotal });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.selectedAddress;
    const paymentMethod = req.body.selectedPaymentMethod;
    const couponCode = req.body.couponCode; // Add couponCode to the request body
    const total = req.body.total; // Add total to the request body

    const userData = await User.findById(userId);
    let cart = await Cart.findOne({ user_id: userId }).populate("products.productId");

    let discount = req.session.discount || 0;
    // if (couponCode) {
    //   const coupon = await Coupon.findOne({ code: couponCode });

    //   if (coupon) {
    //     if (coupon.type === "percentage") {
    //       discount = (coupon.value / 100) * cart.total;
    //     } else if (coupon.type === "fixed") {
    //       discount = coupon.value;
    //     }

    //     if (discount > coupon.maxAmount) {
    //       discount = coupon.maxAmount;
    //     }
    //     console.log(discount,"discount isssssss");
    //     // Mark the coupon as used by the user
    //     coupon.usedBy.push(userId);
    //     await coupon.save();
    //   }
    // }

    const grandTotal = cart.total - discount;
    console.log(grandTotal, "grand total after discount");

    const order = {
      user: userId,
      address: addressId,
      paymentMethod: paymentMethod,
      products: cart.products.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.productPrice,
        total: item.subTotal,
      })),
      grandTotal: grandTotal,
    };

    console.log(order, "order details");

    if (order.paymentMethod === "cashonDelivery") {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { sold: item.quantity },
        });
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
      }

      const orderData = await Order.create(order);
      await Cart.findOneAndUpdate(
        { user_id: userId },
        { $set: { products: [], total: 0 } }
      );

      res.status(200).json({ message: "Order placed successfully" });
      return;
    } else if (order.paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ user: userId });
      
      if (!wallet) {
        return res.status(400).json({ error: 'Wallet not found' });
      }

      const walletAmount = wallet.balance;

      if (walletAmount < order.grandTotal) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      const newWalletAmount = walletAmount - order.grandTotal;
      wallet.balance = newWalletAmount;
      await wallet.save();

      const walletTransaction = await WalletTransaction.create({
        wallet: wallet._id,
        event: "Order Placed",
        orderId: order._id,
        amount: order.grandTotal,
        type: "debit",
      });

      const orderDocument = await Order.create(order);
      const orderId = orderDocument._id;

      for (const product of order.products) {
        const productId = product.product;
        const orderedQuantity = product.quantity;

        await Product.findByIdAndUpdate(
          productId,
          { $inc: { quantity: -orderedQuantity, sold: orderedQuantity } },
          { new: true }
        );
      }

      await Cart.findOneAndUpdate(
        { user_id: userId },
        { $set: { products: [], total: 0 } }
      );

      res.status(200).json({ message: 'Order placed successfully' });
    } else if (order.paymentMethod === "razorpay") {
      console.log("RAZORPAY BACKEND CALLED");

      const option = {
        amount: order.grandTotal * 100,
        currency: "INR",
      };

      
      for (const product of order.products) {
        const productId = product.product;
        const orderedQuantity = product.quantity;

        await Product.findByIdAndUpdate(
          productId,
          { $inc: { quantity: -orderedQuantity, sold: orderedQuantity } },
          { new: true }
        );
      }

      instance.orders.create(option, (err, order) => {
        if (err) {
          console.error("Error creating Razorpay order:", err);
          return res
            .status(500)
            .json({ status: false, message: "Razorpay order creation failed" });
        }
        console.log("Razorpay order created:", order);
        return res.status(201).json({ order });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const ordersuccess=asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  const user_id=await User.findById(userId);  
  try {
    res.render("user/pages/ordersuccess", { user_id});
  } catch (error) {
    console.log(error);
  }
});


const verifyPayment = async (req, res) => {
  try {
    verifyOrderPayment(req.body)
      .then(async () => {
        const userId = req.session.user_id;
        const addressId = req.body.selectedAddress;
        console.log(req.body, "reqqqqqqqqqqqqqqqqqqqqqqq bodyyyyyyyyyyyyyyy");
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user_id: user });
        const orderData = {
          user: userId,
          address: addressId,
          paymentMethod: "razorpay", // Assuming the payment method is 'razorpay'
          products: cart.products.map((item) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.productPrice,
            total: item.total,
          })),
          grandTotal: cart.total,
        };
        console.log(orderData, "orderdataaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        const orderDocument = await Order.create(orderData);

        console.log(orderDocument, "order documenttttttttttttttttt");
        const orderId = orderDocument._id;
        const populatedOrder = await Order.findById(orderId).populate(
          "address"
        );

        if (orderDocument) {
          for (const product of cart.products) {
            const productId = product.productId;
            const orderedQuantity = product.quantity;

            console.log(
              "productId:-",
              productId,
              "orderedQuantity:-",
              orderedQuantity,
              "Product:-",
              Product
            );

            await Product.findByIdAndUpdate(
              productId,
              { $inc: { quantity: -orderedQuantity } },
              { new: true }
            );
          }

          await Cart.findOneAndUpdate(
            { user_id: userId },
            { $set: { products: [], total: 0 } }
          );

          req.session.cartQuantity = null;
          res.status(200).json({ status: "success", order: populatedOrder });
        } else {
          res.status(400).json({
            status: "error",
            msg: "Payment verification failed",
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(400);
      });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: "error",
      msg: "Payment verification failed",
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const result = await cancelOrderById(orderId);
    if (result === "redirectBack") {
      res.redirect("back");
    } else {
      res.json(result);
    }
  } catch (error) {
    throw new Error(error);
  }
};

const cancelOrderById = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const order = await Order.findById(orderId).populate("products.product");
    if (order.products.every((item) => item.returnStatus === "Cancelled")) {
      return "Order is already cancelled";
    }

    if (
      order.paymentMethod === "cashonDelivery" &&
      order.products.every((item) => {
        return item.returnStatus === "Pending" ? false : true;
      })
    ) {
      // Update product quantities and sold counts for each order item
      for (const item of order.products) {
        const updatedOrderItem = await Order.findByIdAndUpdate(
          item._id,
          {
            $set: { "products.$.returnStatus": "Cancelled" },
          },
          { new: true }
        );

        const cancelledProduct = await Product.findById(item.product);
        cancelledProduct.quantity += item.quantity;
        cancelledProduct.sold -= item.quantity;
        await cancelledProduct.save();
      }

      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        status: "Cancelled",
      });

      return res.status(200).json({ status: true });
    } else if (
      order.paymentMethod === "razorpay" &&
      order.products.every((item) => {
        return item.returnStatus === "Pending" || item.returnStatus === "delivered" ? false : true;
      })
    ) {
      // Calculate total amount to be added to wallet
      const totalAmountToBeAdded = order.products.reduce((acc, item) => {
       
        return acc + (item.product.productPrice * item.quantity || 0); // Handle NaN values
      }, 0);
      console.log("Total amount to be added:", totalAmountToBeAdded);

      if (isNaN(totalAmountToBeAdded)) {
        throw new Error("Total amount to be added is not a number");
      }

      // Update product quantities and sold counts for each order item
      for (const item of order.products) {
        const updatedOrderItem = await Order.findByIdAndUpdate(
          item._id,
          {
            $set: { "products.$.returnStatus": "Cancelled" },
          },
          { new: true }
        );

        const cancelledProduct = await Product.findById(item.product);
        cancelledProduct.quantity += item.quantity;
        cancelledProduct.sold -= item.quantity;
        await cancelledProduct.save();
      }

      // Update wallet balance
      const wallet = await Wallet.findOneAndUpdate(
        { user: order.user },
        { $inc: { balance: totalAmountToBeAdded } },
        { new: true, upsert: true }
      );
      const walletTransaction = await WalletTransaction.create({
        wallet: wallet._id,
        event: "Refund",
        orderId: order.orderId,
        amount: totalAmountToBeAdded,
        type: "credit",
    });

      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        status: "Cancelled",
      });

      return res.status(200).json({ status: true });
    }
  } catch (error) {
    throw new Error(error);
  }
};


const returnOrderById = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const order = await Order.findById(orderId).populate("products.product");
    if (order.products.every((item) => item.returnStatus === "Return Requested")) {
      return "Order Return is already Requested";
    }

    if (
      order.paymentMethod === "cashonDelivery" &&
      order.products.every((item) => {
        return item.returnStatus === "delivered" ? false : true;
      })
    ) {
      // Update product quantities and sold counts for each order item
      for (const item of order.products) {
        const updatedOrderItem = await Order.findByIdAndUpdate(
          item._id,
          {
            $set: { "products.$.returnStatus": "Return Requested" },
          },
          { new: true }
        );
        const cancelledProduct = await Product.findById(item.product);
        cancelledProduct.quantity += item.quantity;
        cancelledProduct.sold -= item.quantity;
        await cancelledProduct.save();

       
      }

      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        status: "Return Requested",
      });

      return res.status(200).json({ status: true });
    } else if (
      order.paymentMethod === "razorpay" &&
      order.products.every((item) => {
        return item.returnStatus === "delivered"  ? false : true;
      })
    ) {
      // Update product quantities and sold counts for each order item
      for (const item of order.products) {
        const updatedOrderItem = await Order.findByIdAndUpdate(
          item._id,
          {
            $set: { "products.$.returnStatus": "Return Requested" },
          },
          { new: true }
        );

       
      }

      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        status: "Return Requested",
      });

      return res.status(200).json({ status: true });
    }
  } catch (error) {
    throw new Error(error);
  }
};

const donwloadInvoice = asyncHandler(async (req, res) => {
  try {
      const orderId = req.params.id;
console.log(orderId ,"hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiigiiiiiiiiii")
      const data = await generateInvoice(orderId);
      pdfMake.vfs = vfsFonts.pdfMake.vfs;

      // Create a PDF document
      const pdfDoc = pdfMake.createPdf(data);

      // Generate the PDF and send it as a response
      pdfDoc.getBuffer((buffer) => {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename=invoices.pdf`);

          res.end(buffer);
      });
  } catch (error) {
      throw new Error(error);
  }
});
const removeAppliedCoupon = asyncHandler(async (req, res) => {
  req.session.coupon = null;
  res.status(200).json("Ok");
});



module.exports = {
  loadorderDetailing,
  loadorderspage,
  confirmOrder,
  verifyPayment,
  ordersuccess,
  cancelOrder,
  cancelOrderById,
  returnOrderById,
  donwloadInvoice,
  applyCoupon,
  removeAppliedCoupon,
  
};
