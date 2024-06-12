const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
  service:'Gmail',
  auth:{
    user:'sravansg888@gmail.com',
    pass:'bewc kttq hslp bxmd'
  }
})
module.exports=transporter;