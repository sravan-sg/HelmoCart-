require('dotenv').config();
const Razorpay = require("razorpay")




exports.verifyOrderPayment = (details) => {
  return new Promise((resolve, reject) => {
      try {
          const crypto = require("crypto")
          let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
          hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id)
          hmac = hmac.digest("hex")

          if (hmac === details.payment.razorpay_signature) {
              console.log("Verify SUCCESS")
              resolve();
          } else {
              console.log("Verify FAILED")
              reject(new Error("Signature verification failed"));
          }
      } catch (error) {
          console.error("Verify Exception:", error);
          reject(error);
      }
  });
};