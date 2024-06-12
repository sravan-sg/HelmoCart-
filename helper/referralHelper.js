const Wallet = require('../models/walletModel')
const WalletTransaction = require("../models/walletTransactionModel");
const User = require('../models/usermodels')
const ObjectId = require('mongoose').Types.ObjectId;



const generateReferralCode = (length) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  code += 'Temp-';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset[randomIndex];
  }

  code += '-bake';
  return code;
  
};



// credit for refered user
const creditforReferredUser = async (referredUser) => {
  try {
    const wallet = await Wallet.findOne({user:referredUser._id});
    console.log(wallet,"walletttttt");
    if (!wallet) throw new Error("Wallet not found");

    // Credit referred user
    wallet.balance += 100;
    await wallet.save();

    // Create wallet transaction
    const transaction = new WalletTransaction({
      wallet: wallet._id,
      amount: 100,
      type: 'credit',
      event: 'Referral bonus',
    });
    await transaction.save();
  } catch (error) {
    console.error("Error crediting referred user:", error);
    throw error;
  }
}

const creditforNewUser = async (newUser) => {
  try {
    const wallet = new Wallet({ user: newUser._id });
    await wallet.save();

    // Credit new user
    wallet.balance += 50;
    await wallet.save();

    // Create wallet transaction
    const transaction = new WalletTransaction({
      wallet: wallet._id,
      amount: 50,
      type: 'credit',
      event: 'New user bonus',
    });
    await transaction.save();
  } catch (error) {
    console.error("Error crediting new user:", error);
    throw error;
  }
}

module.exports = {
  creditforReferredUser,
  creditforNewUser,
  generateReferralCode
}