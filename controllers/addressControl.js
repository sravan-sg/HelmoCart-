const Address = require("../models/addressModel");
const User = require("../models/usermodels");
const asyncHandler = require("express-async-handler");
const order=require("../models/orderModel");

const getAllAddress = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  const user = await User.findById(userId)
  const user_id=await User.findById(user);
  const address = await Address.find({ user: userId });
  const dlt = await Address.findByIdAndDelete(req.params.id);
  res.render("user/pages/address", { address, account: true, user ,dlt,user_id});
});

const addAddressPage = asyncHandler(async (req, res) => {
  const user = req.session.user_id;
  const user_id=await User.findById(user);
  // const address = await Address.find({ user_id: req.session.user_id });
  res.render("user/pages/addAddress", { user ,user_id});
});

//POST request for storing new address
const newAddress = asyncHandler(async (req, res) => {
  req.body.user_id = req.session.user_id;
  let data = {}
  data = req.body
  data.user = req.body.user_id
  console.log(data);
  const newAddress = await Address.create(req.body);
  if (newAddress) {
    console.log(newAddress);
    const redirect = req.query.redirect;
    if (redirect === 'checkout') {
      res.redirect("/checkout"); // Redirect to checkout page
    } else {
      res.redirect("/address"); // Redirect to address page
    }
  } else {
    throw new Error();
  }
});



const editAddressPage = asyncHandler(async (req, res) => {
  const user = req.session.user_id;
  const user_id=await User.findById(user);
  const newAddress = await Address.findById(req.query.id);
  // const address = await Address.find({ user_id: req.session.user_id });
  res.render("user/pages/editAddress", { newAddress, user,user_id});
});

const editAddress = async (req, res) => {
  try {
    const user = req.session.user_id;
    const user_id=await User.findById(user);
    const { id } = req.query;
    const { user_name, phone, pincode, address, town, state } = req.body;

    const updatedAddress = await Address.findByIdAndUpdate(id, {
        user_name,
        phone,
        pincode,
        address,
        town,
        state
    }, { new: true });

    if (!updatedAddress) {
        return res.status(404).json({ message: 'Address not found' });
    }

    // Fetch all addresses for the user after update
    const addresses = await Address.find({ user: user });

    res.render('user/pages/address', { address: addresses, user,user_id});
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
}
};

const deleteAddress = asyncHandler(async (req, res) => {
  try{
    const id =req.params.id;
  const dlt = await Address.findOneAndDelete({_id:id});
  res.redirect('/address');
  }
  catch(error){
      throw new Error(error) 
  }
});






module.exports = {
  getAllAddress,
  addAddressPage,
  newAddress,
  editAddressPage,
  editAddress,
  deleteAddress,
 
};