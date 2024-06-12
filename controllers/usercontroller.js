const mongoose = require('mongoose');
const User=require('../models/usermodels');
const Product=require('../models/productModel');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const Category = require("../models/categoryModel")
const randomstring=require('randomstring');
const Wallet=require('../models/walletModel');
const { sendOtp } = require('../utility/nodemailer')
const { sendVerifymail } = require('../utility/nodemailer')

// Import the generateOTP function from the utility module
const { generateOTP } = require('../utility/nodemailer'); // Adjust the path accordingly

const WalletTransaction=require('../models/walletTransactionModel')




                                             
const loadlandingpage = async (req, res) => {
  try {
    const user = req.session.user_id;

    const getalldata = await Product.find().populate({
      path: 'categoryName',
      match: { isListed: true }
    });
    
    res.render("./user/pages/index", { getalldata,user});
  } catch (error) {
    throw new Error(error);
  }
};





const loadloginpage = async (req, res) => {
  try {
    const user=req.session.user_id;
    console.log(user)
    res.render("./user/pages/login", {user} );
  } catch (error) {
    throw new Error(error);
  }
};

const loadregistration=async(req,res)=>{
  try {
    const user=req.session.user_id;
    res.render('./user/pages/registration',{user})
  } catch (error) {
    throw new Error(error);
  }
}
const loaduserprofile=async(req,res)=>{
  try {
    const user_id=req.session.user_id;
    const user=await User.findById(user_id);
    res.render('./user/pages/userprofile',{user_id,user})
  } catch (error) {
    throw new Error(error);
  }
}

async function editProfilePost(req, res) {
  // Get the user's current information.
  const userId =req.session.user_id;
  const user = await User.findOne({ _id: userId });

  // Get the user's updated information.
  const newuserName = req.body.username;
  const newEmail = req.body.email;
  const newMobile=req.body.mobile;


  // Update the user's information.
  user.username = newuserName;
  user.email = newEmail;
  user.mobile=newMobile;
  await user.save();

  // Return a success response.
  
  res.redirect('/userprofile')
}

const loadaboutpage=async(req,res)=>{
  try {
    const user=req.session.user_id;
    res.render('./user/pages/about',{user})
  } catch (error) {
    throw new Error(error);
  }
}


const loadcontactpage=async(req,res)=>{
  try {
    const user=req.session.user_id;
    res.render('./user/pages/contact',{user})
  } catch (error) {
    throw new Error(error);
  }
}

const loadshoppage = async (req, res) => {
  try {
    const user = req.session.user_id;
    const sortBy = req.query.sortBy || 'priceLowToHigh';
    const priceRange = req.query.priceRange || 'all';
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 4;

    // Build search filter
    const searchFilter = searchQuery ? { title: { $regex: '.*' + searchQuery + '.*', $options: 'i' } } : {};

    // Fetch products with search filter
    let query = Product.find(searchFilter);

    // Filter by price range
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under25':
          query = query.where('productPrice').lt(1000);
          break;
        case '25to50':
          query = query.where('productPrice').gte(1000).lte(2000);
          break;
        case '50to75':
          query = query.where('productPrice').gte(2000).lte(5000);
          break;
        case '75to100':
          query = query.where('productPrice').gt(5000);
          break;
        default:
          break;
      }
    }

    // Apply sorting based on the sortBy parameter
    if (sortBy === 'priceLowToHigh') {
      query = query.sort({ productPrice: 1 });
    } else if (sortBy === 'priceHighToLow') {
      query = query.sort({ productPrice: -1 });
    }

    // Get total product count for pagination
    const totalProducts = await Product.countDocuments(query);

    // Apply pagination
    query = query.skip((page - 1) * limit).limit(limit);

    // Execute query to get the products
    const getalldata = await query.exec();

    res.render('./user/pages/shop', {
      product: getalldata,
      getalldata,
      user,
      searchQuery,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      sortBy,
      priceRange
    });
  } catch (error) {
    throw new Error(error);
  }
};



// const loadshoppage = async (req, res) => {
//   try {
//     const user = req.session.user_id;
//     const sortBy = req.query.sortBy || 'priceLowToHigh'; // Default sorting by price low to high
//     const priceRange = req.query.priceRange || 'all';
//     const searchQuery = req.query.search || '';
//     const page = parseInt(req.query.page) || 1;
//     const limit = 6;

//     // Build search filter
//     const searchFilter = searchQuery ? { title: { $regex: '.*' + searchQuery + '.*', $options: 'i' } } : {};

//     // Fetch products with search filter
//     let getalldata = await Product.find(searchFilter);

//     // Filter by price range
//     if (priceRange !== 'all') {
//       switch (priceRange) {
//         case 'under25':
//           getalldata = getalldata.filter(product => product.productPrice < 1000);
//           break;
//         case '25to50':
//           getalldata = getalldata.filter(product => product.productPrice >= 1000 && product.productPrice <= 2000);
//           break;
//         case '50to75':
//           getalldata = getalldata.filter(product => product.productPrice >= 2000 && product.productPrice <= 5000);
//           break;
//         case '75to100':
//           getalldata = getalldata.filter(product => product.productPrice > 5000);
//           break;
//         default:
//           break;
//       }
//     }

//     // Apply sorting based on the sortBy parameter
//     if (sortBy === 'priceLowToHigh') {
//       getalldata = getalldata.sort((a, b) => a.productPrice - b.productPrice);
//     } else if (sortBy === 'priceHighToLow') {
//       getalldata = getalldata.sort((a, b) => b.productPrice - a.productPrice);
//     }

//     // Pagination
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;
//     const paginatedData = getalldata.slice(startIndex, endIndex);

//     // Get total product count for pagination
//     const totalProducts = getalldata.length;

//     res.render('./user/pages/shop', {
//       product: paginatedData,
//       getalldata,
//       user,
//       searchQuery,
//       totalPages: Math.ceil(totalProducts / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     throw new Error(error);
//   }
// };




const loadcartpage = async (req, res) => {
  try {
    const user=req.session.user_id;
    console.log(user)
    res.render("./user/pages/cart", {user} );
  } catch (error) {
    throw new Error(error);
  }
};






// inserting User-- 
// const register = async (req, res) => {
//   try {
//       const emailCheck = req.body.email;
//       const mobileCheck = req.body.mobile;

//       const checkData = await User.findOne({ email: emailCheck });
//       const mobileData = await User.findOne({ mobile: mobileCheck });

//       if (mobileData) {
//           return res.render('./user/pages/registration', { userCheck: "User already exists, please try with a new mobile", user });
//       }

//       if (checkData) {
//           return res.render('./user/pages/registration', { mobileCheck: "User already exists, please try with a new email", user });
//       } else {

//           const UserData = {
//               username: req.body.username,
//               email: req.body.email,
//               password: req.body.password,
//               mobile: req.body.mobile,
//           };

//           // Generate referral code for the new user
//           const referralCode = generateReferralCode(8);

//           UserData.referralCode = referralCode;

//           const OTP = generateOTP(); /** otp generating **/

//           req.session.otpUser = { ...UserData, otp: OTP };
//           console.log(req.session.otpUser.otp)

//           // Create the new user and store it in newUser
//           const newUser = await User.create(UserData);

//           // Check if referral code is valid
//           const referralCodeValue = req.body.referralCode;
//           if (referralCodeValue) {
//               const referredUser = await User.findOne({ referralCode: referralCodeValue });
//               if (referredUser) {
//                   // Credit new user's wallet
//                   const newUserWallet = await Wallet.findOneAndUpdate({ user: newUser._id }, { $inc: { balance: 50 } }, { new: true });

//                   // Credit referred user's wallet
//                   const referredUserWallet = await Wallet.findOneAndUpdate({ user: referredUser._id }, { $inc: { balance: 100 } }, { new: true });
//               }
//           }

//           // req.session.mail = req.body.email;  

//           /***** otp sending ******/
//           try {
//               sendOtp(req.body.email, OTP, req.body.username);
//               return res.redirect('/otp');
//           } catch (error) {
//               console.error('Error sending OTP:', error);
//               return res.status(500).send('Error sending OTP');
//           }
//       }
//   } catch (error) {
//       throw new Error(error);
//   }
// }


const register = async (req, res) => {
  try {
    const emailCheck = req.body.email.trim();
    const mobileCheck = req.body.mobile.trim();
    req.session.referralCode = req.body.referralCode.trim() || null;
    const referralCode = req.session.referralCode;
    const user = req.session.user_id;

    const checkData = await User.findOne({ email: emailCheck });
    const mobileData = await User.findOne({ mobile: mobileCheck });

    if (mobileData) {
      return res.render('./user/pages/registration', {
        userCheck: "User already exists, please try with a new mobile",
        mobileCheck: null,
        message: null,
        user
      });
    }

    if (checkData) {
      return res.render('./user/pages/registration', {
        mobileCheck: "User already exists, please try with a new email",
        userCheck: null,
        message: null,
        user
      });
    } else {
      let referrer;

      if (referralCode) {
        referrer = await User.findOne({ referralCode });

        if (!referrer) {
          return res.render('./user/pages/registration', {
            message: 'Invalid Referral Code',
            userCheck: null,
            mobileCheck: null,
            user
          });
        }
        if (referrer.referredUsers.includes(req.body.email)) {
          return res.render('./user/pages/registration', {
            message: 'Referral code has already been used by this email',
            userCheck: null,
            mobileCheck: null,
            user
          });
        }
      }

      const UserData = {
        username: req.body.username.trim(),
        email: req.body.email.trim(),
        password: req.body.password.trim(),
        mobile: req.body.mobile.trim(),
      };

      const OTP = generateOTP(); /** otp generating **/

      req.session.otpUser = { ...UserData, otp: OTP };
      console.log(req.session.otpUser.otp);

      try {
        sendOtp(req.body.email, OTP, req.body.username);
        return res.redirect('/otp');
      } catch (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).send('Error sending OTP');
      }
    }
  } catch (error) {
    throw new Error(error);
  }
}








// Function to generate a random string for referral code











//password hashing
const securePassword=async(password)=>{
  try {
    const passwordHash=await bcrypt.hash(password,10)
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
}


/*************** OTP Section *******************/
// loadSentOTP page Loading--
const sendOTPpage = async (req, res) => {
  try {
    const user=req.session.user_id;
      const email = req.session.otpUser
      res.render('./user/pages/verifyOTP',{user})
  } catch (error) {
      throw new Error(error)
  }

}



//verify otp
const verifyOTP = asyncHandler(async (req, res) => {
  try {
    const enteredOTP = req.body.otp;
    const email = req.session.otpUser.email;
    const storedOTP = req.session.otpUser.otp; // Getting the stored OTP from the session
    const user = req.session.otpUser;
    let messages = "";

    if (enteredOTP == storedOTP) {

      user.password = await bcrypt.hash(user.password, 10);

      
      if (req.session.referralCode) {
        
        const referralCode = req.session.referralCode;
        
        const referredUser = await User.findOne({ referralCode });
        if (referredUser) {
          // Add 100 to the referred user's wallet balance
          const wallet = await Wallet.findOne({ user: referredUser._id });
          if (wallet) {
            wallet.balance += 100;
            await wallet.save();
            await WalletTransaction.create({
              wallet: wallet._id,
              amount: 100,
              type: "credit",
              event: "Referral Bonus"
            });
          }
        }
        // Add 50 to the new user's wallet balance
        var newUser = await User.create(user);
        const newWallet = new Wallet({ user: newUser._id, balance: 50 });
        await newWallet.save();

        await WalletTransaction.create({
          wallet: newWallet._id,
          amount: 50,
          type: "credit",
          event: "Welcome Bonus"
        });

          
          if (!user.Wallet) {
            user.Wallet = [];
          }
        user.Wallet.push(newWallet._id);
        delete req.session.otpUser.otp;
      delete req.session.referralCode;
      }
      else{
        var newUser = await User.create(user);
        delete req.session.otpUser.otp;
      delete req.session.referralCode
      }

      
      delete req.session.otpUser.otp;
      delete req.session.referralCode;
      res.redirect("/login");
    } else {
      messages = "Verification failed, please check the OTP or resend it.";
      console.log("verification failed");
      res.render("./user/pages/verifyOTP", { messages, email, user });
    }
    
  } catch (error) {
    throw new Error(error);
  }
});

  //resending otp
  const reSendOTP = async (req, res) => {
    try {
        const OTP = generateOTP() /** otp generating **/
        req.session.otpUser.otp = { otp: OTP };
        const user = req.session.otpUser;
       const user1=req.session.user_id;

        const email = req.session.otpUser.email
        const username = req.session.otpUser.username


        // otp resending 
        try {
            sendOtp(email, OTP, username);
            console.log('otp is sent');
            console.log(OTP)
            return res.render('./user/pages/reSendOtp', { email ,user});
        } catch (error) {
            console.error('Error sending OTP:', error);
            return res.status(500).send('Error sending OTP');
        }
        res.render('./user/pages/reSendOtp', { email ,user});

    } catch (error) {
        throw new Error(error)
    }
}




  //verify resend otp
  const verifyResendOTP = asyncHandler(async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        console.log(enteredOTP);
        const storedOTP = req.session.otpUser.otp;
        console.log(storedOTP);

        const user = req.session.otpUser;

        if (enteredOTP == storedOTP.otp) {
            console.log('inside verification');
            user.password = await bcrypt.hash(user.password, 10);
            const newUser = await User.create(user);
            if (newUser) {
                console.log('new user insert in resend page', newUser);
            } else { console.log('error in insert user') }
            delete req.session.otpUser.otp;
            res.redirect('/login');
        } else {
            console.log('verification failed');
        }
    } catch (error) {
        throw new Error(error);
    }
});



// const login = async (req, res) => {

//   try {
//     const { email, password } = req.body;
//     // Find the user by username using async/await
//     const user = await User.findOne({email });
//     if (!user) {
//       const errorMessage = "Invalid username or password";
//       return res.render("user/pages/login", { errorMessage });
//     } else {
//       if(user.isBLock){
//         const errorMessage = "User is blocked. Please contact support.";
//         return res.render('user/pages/login',{errorMessage})
//       }
//       const passwordMatch = await user.verifyPassword(password);
//       if (!passwordMatch) {
//         const errorMessage = "Invalid password";
//         return res.render('user/pages/login', { errorMessage });
//       } else {
//         req.session.userId = user._id;
//         // const getalldata= await Product.find();  
//         res.render('./user/pages/shop',{user});
//       }
//     }
//     // Start a user session
//   } catch (error){
//     console.log(error);
//     res.status(500).json({ error: "An error occurred" });
//   }
// };


const login = async (req, res) => {
  try {
    const { email , password  } = req.body;
    // Find the user by username using async/await
    const user = await User.findOne({ email });
    console.log(user,"user isssssssssssss");
   
    if (!user) {
      const errorMessage = "Invalid username or password";
      return res.render("user/pages/login", { errorMessage ,user});
    } else {
      if (user.isBLock) {
        const errorMessage = "User is blocked. Please contact support.";
        return res.render("user/pages/login", { errorMessage,user });
      }
      if (user && user.isBLock) {
        req.session.user_id=null;
        res.redirect('/')
      }
      const passwordMatch = await user.verifyPassword(password);
      if (!passwordMatch) {
        const user = req.session.user_id 
        const errorMessage = "Invalid password";
        return res.render("user/pages/login", { errorMessage,user });
      } else {
        req.session.user_id = user._id;
        const getalldata = await Product.find(); 
        res.render("./user/pages/index",{user,getalldata});
      }
    }
    // Start a user session
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
};



const loadproductdetailspage=async(req,res)=>{
  try {
    const productId = req.query.id
    console.log(productId)
    const user=req.session.user_id;
    const getalldata = await Product.findById(productId)

 res.render('./user/pages/productdetails',{getalldata,user})

    //  res.render('./user/pages/productdetails')
  } catch (error) {
    throw new Error(error);
  }
}


const logout = async(req,res)=>{
  try{
    req.session.user_id = null;
    res.redirect("/")
  }catch(error){
    throw new Error(error)
  }
}




const forgetLoad = async (req, res) => {
  try {
    const user=req.session.user_id;

      res.render('./user/pages/forgetpsw',{user})
  } catch (error) {
      throw new Error(error)
  }
}

//reset pswd postemail--
const forgetpswd = async (req, res) => {

  try {

      const email = req.body.email
      const user = await User.findOne({ email: email });
      if (user) {
          const randomString = randomstring.generate();
          const updateData = await User.updateOne({ email: email }, { $set: { token: randomString } })
          sendVerifymail(user.username, user.email, randomString);
          res.render('./user/pages/forgetpsw', {errorMessage : "Please check your mail to reset your password",user})
      } else {
          res.render('./user/pages/forgetpsw', { errorMessage: "user email is incorrect",user})
      }

  } catch (error) {
      throw new Error(error)
  }
}

//forget pswd page get---
const forgetPswdload = async(req,res)=>{
  const user=req.session.user_id;


  try {
      const token =req.query.token;  
            
      const tokenData = await User.findOne({token:token})

      if(tokenData){
          res.render('./user/pages/forget-password',{user_id :tokenData._id,user});


      }else{
          res.render('./user/pages/404',{message:"Token is invalid",user})
      }
  } catch (error) {
      throw new Error(error)
  }
}

//forget pswd post--
// const resetPswd = async(req,res)=>{
  


//   try {
//       const password = req.body.password;
//       const user= req.session.user_id;
//       console.log(user);
//       const secure_password = await securePassword(password);

//      const updateData = await User.findByIdAndUpdate({_id:user},{$set:{password:secure_password,token:''}})
//      res.render('./user/pages/login',{message:'password reset successfully',user})

//   } catch (error) {
//       throw new Error(error)
//   }
// }

const resetPswd = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const user = req.session.user_id;
    

    console.log('Entered resetPswd function');

    if (!user) {
      console.log('User not found');
      return res.status(400).render('./user/pages/login', { message: 'User not found' , user});
    }

  

    const securePassword = await securePassword(newPassword);

    const updateData = await User.findByIdAndUpdate(
      { _id: user },
      { $set: { password: securePassword, token: '' } },
      { new: true } // Ensure that the updated document is returned
    );

    console.log('Update data:', updateData);

    // Check if the password update was successful
    if (!updateData) {
      console.log('Error updating password');
      return res.status(500).render('./user/pages/login', { message: 'Error updating password', user});
    }

    console.log('Entered password validation');

    // Verify the new password using the updated user information
    const isPasswordValid = await comparePassword(newPassword, updateData.password);

    console.log('Stored hashed password:', updateData.password);
    console.log('New hashed password:', securePassword);

    if (isPasswordValid) {
      // Password is valid, proceed with login
      // Assign the updated user information to the session
      req.session.user = updateData;

      console.log('Password reset successfully');

      // Render the dashboard view with the updated user information
      return res.render('./user/pages/dashboard', { message: 'Password reset successfully', user: updateData });
    } else {
      // Password is not valid, handle accordingly
      console.log('Invalid password');
      return res.render('./user/pages/login', { message: 'Invalid password'});
    }

  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).render('./user/pages/login', { message: 'Error resetting password' });
  }
};


const loadResetpage = async (req, res) => {
  try {
    const user=req.session.user_id;
    console.log(user)
    res.render("./user/pages/reset", {user} );
  } catch (error) {
    throw new Error(error);
  }
};

const UpdatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    console.log('Provided Old Password:', oldPassword);

    // Compare the old password
    if (!oldPassword) {
      console.error('Old password not provided');
      return res.status(400).json({ error: 'Old password not provided' });
    }

    const isPasswordValid = await user.isPasswordMatched(oldPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Hash and update the new password
    try {
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      console.log(newPassword);
      user.password = hashedNewPassword;
    } catch (hashError) {
      console.error('Error hashing new password:', hashError);
      return res.status(500).json({ error: 'Error hashing new password' });
    }

    // Save the updated user
    await user.save();

    res.redirect('/reset');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const loadwalletpage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 }); // Include user field when creating a new wallet
    }

    res.render('./user/pages/wallet', { user, wallet });
  } catch (error) {
    throw new Error(error);
  }
}


const walletTransactionspage = asyncHandler(async (req, res) => {
  try {
      const walletId = req.query.id;
      const walletTransactions = await WalletTransaction.find({ wallet: walletId }).sort({ timestamp: -1 });
      const userId = req.session.user_id;
      const user = await User.findById(userId);
     
      // const walletTransactions = await WalletTransaction.find({ wallet: walletId }).sort({ timestamp: -1 });
      res.render("user/pages/walletTransaction", {
          title: "Wallet Transactions",
          page: "Wallet-Transactions",
          walletTransactions,user
      });
  } catch (error) {
      throw new Error(error);
  }
});






module.exports={loadloginpage ,
  register,
  securePassword,
  sendOTPpage,
  loadregistration,
  loadaboutpage,
  verifyOTP,
  loadcontactpage,
  loadshoppage, 
  loadResetpage,
  login,
  loadlandingpage,
  loadproductdetailspage,
  register,
  reSendOTP,
  verifyResendOTP,
  logout,
  loaduserprofile,
  loadcartpage,
  forgetLoad,
  forgetpswd,
  forgetPswdload,
  resetPswd,
  editProfilePost,
  UpdatePassword,
  loadwalletpage,
  walletTransactionspage

};
