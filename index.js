const app = require("./app"); //importing app from appjs
const connectwithDb = require("./config/db");
require("dotenv").config(); //requiring from env file
const cloudinary = require("cloudinary");

//connect with DB
connectwithDb();

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(process.env.PORT, () => {
  console.log(`SERVER UP AND RUNNING ON PORT ${process.env.PORT}`);
});
