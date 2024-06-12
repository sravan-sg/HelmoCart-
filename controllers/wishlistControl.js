const Product = require("../models/productModel");
const User = require("../models/usermodels");
const wishlist = require("../models/wishlistModel");







const loadwishlistpage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const productId = req.body.productId;
    
const userwishlist= await wishlist.find().populate(
  "productId");

    res.render("./user/pages/wishlist", {
      user,
      userwishlist,productId
     
    });
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
};
const addToWishlist = async (req, res) => {
  try {
      
      const productId = req.params.productId;
      const userId = req.session.user_id;
      const user = await User.findById(userId);


      const checkAlredyexists = await wishlist.findOne({ productId });

        if (checkAlredyexists) {
            return res.status(200).json({ exists: "Product Alredy Exists in the Wishlist" })
        }
        const getProduct = await Product.findById(productId);

      // Create a new wishlist item with the product ID
      const newWishlistItem = new wishlist({
          productId: getProduct._id,
          userId :userId ,
          user:user,
          // For example, if the user is logged in, you can get their user ID from the session
          // user_id: req.session.user_id,
          // Assuming user_id is stored in session
      });

      // Save the new wishlist item to the database
      await newWishlistItem.save();

      // Redirect the user to the previous page or any other desired page
      res.redirect("back");
  } catch (error) {
      console.error(error);
      // Handle any errors that occur during the process
      res.status(500).send("Internal Server Error");
  }
};

const removewishlist =async (req,res)=>{
  const productId=req.body.productId;
  try {
    const getproduct=await wishlist.findOneAndDelete({ productId: productId });
    if(!getproduct){
      return res.status(400).json({error:"wishlist Remove Failed"});
    }
    
    res.redirect('/loadwishlist')
  } catch (error) {
    console.log(error);
    return res.status(500).json({error:"internal server error"})
  }
 
}






module.exports = {loadwishlistpage ,addToWishlist,removewishlist }