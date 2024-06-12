const Product = require("../models/productModel");
const User = require("../models/usermodels");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const coupon=require("../models/couponModel")



const loadshopcartpage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const error = req.session.insufficientstock
      ? req.session.insufficientstock
      : "";
    req.session.insufficientstock = "";
    const getCart = await Cart.find({ user_id: user }).populate(
      "products.productId"
    );
    

    let total = 0;

    if (getCart && getCart.length > 0) {
      getCart.forEach((cartItem) => {
        if (cartItem.products && cartItem.products.length > 0) {
          cartItem.products.forEach((productItem) => {
            const productTotal =
              productItem.productId.productPrice * productItem.quantity;
            total += productTotal;
            productItem.subtotal = productTotal;
          });
        }
      });
    }

    const additionalCosts = 0;

    res.render("./user/pages/shopingcart", {
      user,
      getCart,
      total,
      errorMessage: error,
    });
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    const product = await Product.findById(productId);

    let cart = await Cart.findOne({ user_id: userId }).populate(
      "products.productId"
    );

    if (!cart) {
      cart = await Cart.create({ user_id: userId, products: [] });
    }
    const existingItem = cart.products.find((item) =>
      item.productId.equals(productId)
    );
    

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.subTotal = existingItem.quantity * product.productPrice;
      if (existingItem.quantity > product.quantity) {
        existingItem.quantity = product.quantity;
        
      }
    } else {
      cart.products.push({
        productId: productId,
        quantity: 1,
        subTotal: product.productPrice,
      });
     
    }

    cart.total = cart.products.reduce((acc, item) => {
      return acc + (item.subTotal || 0);
    }, 0);

    await cart.save();
    res.redirect("/shopingcart");
  } catch (error) {
    console.log(error.message);
  }
};

const removeProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const user = req.session.user_id;

    const getCart = await Cart.findOne({ user_id: user });
    if (getCart) {
      const productIndex = getCart.products.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (productIndex !== -1) {
        const removedProduct = getCart.products[productIndex];

        const removedsubTotal = removedProduct.subTotal;

        getCart.products.splice(productIndex, 1);

        if (!isNaN(removedsubTotal)) {
          getCart.total = getCart.total - removedsubTotal;
        } else {
          console.error("Invalid removedsubTotal:", removedsubTotal);
        }

        await getCart.save();

        res.redirect("/shopingcart");
      } else {
        res.redirect("/shopingcart");
      }
    } else {
      res.redirect("/shopingcart");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const updateCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    let updatedQuantity = req.body.quantity;
    const productId = req.body.productId;

    const getCart = await Cart.findOne({ user_id: user._id }).populate(
      "products.productId"
    );

    if (!getCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for the user." });
    }

    const productIndex = getCart.products.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    if (productIndex !== -1) {
      getCart.products[productIndex].quantity = parseInt(updatedQuantity, 10);
      getCart.products[productIndex].subTotal =
      getCart.products[productIndex].quantity *
      getCart.products[productIndex].productId.productPrice;

      const newTotal = getCart.products.reduce(
        (acc, item) => acc + (item.subTotal || 0),
        0
      );
      getCart.total = newTotal;

      await getCart.save();

      const updatedSubtotal = getCart.products[productIndex].subTotal;

      return res.status(200).json({
        success: true,
        total: newTotal,
        updatedSubtotal: updatedSubtotal,
        productId: productId,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in the cart." });
    }
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
const loadcheckoutpage = async (req, res) => {
  try {
    const userId=req.session.user_id;
    const user=await User.findById(userId);
    const getCart = await Cart.find({user_id: user}).populate(
      "products.productId",
    );
  
    const hasInsufficientStock= getCart.some((cartItem)=>{
      return cartItem.products.some((productItem)=>{
        return productItem.productId.quantity < productItem.quantity;
      });
    });
    if(hasInsufficientStock){
      req.session.insufficientstock=
      "some products in your cart have insufficient stock";
      return res.redirect("/shopingCart");
    }
const total=getCart.reduce((acc,cart)=>acc+cart.total,0);



    const address = await Address.find({user:userId});
    const Coupon=await coupon.find();
    
   
  res.render("./user/pages/checkout",{
    getCart,
    user,address,total,Coupon
  })
    
  }
  catch(error){
    console.log(error);
  }
};
module.exports = {
  loadshopcartpage,
  addToCart,
  removeProduct,
  updateCart,
  loadcheckoutpage,
};
