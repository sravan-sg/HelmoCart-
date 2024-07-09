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
const {isAuthenticated} = require("./middleware/userAuth")
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

app.use(isAuthenticated);

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

// 404 route for user side
app.use("/", (req, res) => {
  res.status(404).render('./user/pages/404');
});

// 404 route for admin side
app.use("/admin", (req, res) => {
  res.status(404).render('./admin/pages/page404', { title: 'Error'});
});



app.listen(PORT, () => {
  console.log(`server is running succesfully on ${PORT}`);
});
