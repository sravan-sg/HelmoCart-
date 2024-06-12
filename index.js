const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");
const PORT = 3000;
const userRoute = require("./routes/userRoute");
const expressLayout = require("express-ejs-layouts");
const adminRoute = require("./routes/adminRoute");
const database = require("./config/database");
const bodyParser = require("body-parser");
require("dotenv").config();
const session = require("express-session");
const nocache = require("nocache");
const connectFlash = require('connect-flash')
app.use(express.json());
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});



app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000  
  },
}))
// using for sending message to ejs
app.use(connectFlash());
app.use((req, res, next) => {
    res.locals.messages = req.flash()
    next();
})

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("public"));
app.use("/admin", express.static(__dirname + "/public/admin"));
app.use(expressLayout);
// res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
// app.use(nocache);
database.dbConnect();

app.use(
  session({
    secret: "process.env.SECRET", // Change this to a strong secret in a real application
    resave: false,
    saveUninitialized: true,
    cookies: {
      httponly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.listen(PORT, () => {
  console.log(`server is running succesfully on ${PORT}`);
});
