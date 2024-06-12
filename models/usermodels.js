
const bcrypt=require('bcrypt');
const crypto=require('crypto');
const mongoose = require('mongoose'); // Erase if already required

// const Schema=mongoose.Schema;

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        
    },
    email:{
        type:String,
        required:true,
      
    },
    mobile:{
        type:String,
        required:true,
      
    },
   
    password:{
        type:String,
        required:true,
    },
    // salt:string,
    isBLock:{
      type:Boolean,
      default:false
    },
    token:{
        type:String,
        default:'',

    },
    addresses:[{ type:mongoose.Schema.Types.ObjectId,ref:"Address"}],
    Wallet:[{ type:mongoose.Schema.Types.ObjectId,ref:"Wallet"}],

   
    referralCode: {
        type: String,
        default: generateRandomReferralCode,
        unique: true, 
    },
    referredUsers: [{
        type: String
    }],
},
   


{timestamps:true });


// Add a method to the schema to verify the provided password
userSchema.methods.verifyPassword = function (password) {
    // Compare the provided password with the hashed password in the database
    return bcrypt.compareSync(password, this.password);
};

function generateRandomReferralCode() {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 6;
    let referralCode = '';
    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters.charAt(randomIndex);
    }
    return referralCode;
}




//Export the model
module.exports = mongoose.model('User', userSchema);


