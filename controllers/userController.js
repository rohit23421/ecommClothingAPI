const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

//singup controller
exports.signup = BigPromise(async (req, res, next) => {
  //files upload
  // let result;

  if (!req.files) {
    return next(new CustomError("Photo is required for signup", 400));
  }

  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError("Name, email and password are required", 400));
  }

  let file = req.files.photo;

  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  //push user details to the DB
  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  //calling the cookietoken function from the utils folder for sending the jwt token
  cookieToken(user, res);
});

//login controller
exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  //check for email and password present or not
  if (!email || !password) {
    return next(new CustomError("Please provide email and password", 400));
  }

  //if email present in DB then find the email and set it to a user
  const user = await User.findOne({ email }).select("+password");

  //if user not present in DB
  if (!user) {
    return next(
      new CustomError("You are not a user,Please singup to proceed", 400)
    );
  }

  //compare the passed on field and the function from the User model to validate the passowrd
  const isPasswordCorrect = await user.isValidatedPassword(password);

  //if password doesnt match then
  if (!isPasswordCorrect) {
    return next(new CustomError("Email and Password doesn't match", 400));
  }

  //if all goes good then we start calling the cookietoken function from the utils folder for sending the jwt token
  cookieToken(user, res);
});

//logout controller
exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout Successful",
  });
});

//forgot password controller
exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  //check whether this email exist in DB or not
  const user = await User.findOne({ email });

  //if user not found in DB
  if (!user) {
    return next(
      new CustomError("Email not found,Please register to proceed", 400)
    );
  }

  //get token from user mode.methods
  const forgotToken = user.getForgotPasswordToken();

  //save user fields to DB
  await user.save({ validateBeforeSave: false });

  //create a URL
  const myUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  //send a email to the user or crafting or the message
  const message = `Copy paste this link in the URL and hit enter \n\n ${myUrl}`;

  //attempt to send email
  try {
    await mailHelper({
      email: user.email,
      subject: "Tshirt Store - Password reset email",
      message,
    });

    //json response for testing API if email is successfully sent
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new CustomError(error.message, 500));
  }
});

//password reset controller
exports.passwordReset = BigPromise(async (req, res, next) => {
  //grabbing the token from the URL
  const token = req.params.token;

  const encryToken = crypto.createHash("sha256").update(token).digest("hex");

  //find the user as per the token
  const user = await User.findOne({
    encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  //check if user is present
  if (!user) {
    return next(new CustomError("Token is invalid or expired", 400));
  }

  //now reset the password if user present
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError("Password and Confirmed password do not match", 400)
    );
  }

  user.password = req.body.password;

  //setting both as undefined to empty them
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  //send a json response or send token
  cookieToken(user, res);
});

//infomation about the loggedIn user
exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  //find the user by id that we have injected in the user.js moddleware using jwt and now accessing the id property of the user that we inserted
  const user = await User.findById(req.user.id);

  //send response and user data
  res.status(200).json({
    success: true,
    user,
  });
});

//changing the password
exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select("+password");

  //check if the new password & the old passwrod mathces or not
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  //if password doesnt match
  if (!isCorrectOldPassword) {
    return next(new CustomError("Old password is incorrect", 400));
  }

  //if old and new matches
  user.password = req.body.password;

  await user.save();

  //since the info has been changed then we need to update the cookietoken
  cookieToken(user, res);
});

//update user details controller
exports.updateUserDetails = BigPromise(async (req, res, next) => {
  //as user will send a data so we need to hold it as an object and use it later
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  //check if the request is sending a photo or not
  if (req.files) {
    //find the user by ID and holding it to be updated later on
    const user = await User.findById(req.user.id);

    //holding the photo in a variable
    const imageId = user.photo.id;

    //find the photo by ID from the cloudinary database and destroy/delete it
    const resp = await cloudinary.v2.uploader.destroy(imageId);

    //now upload the new photo the user has sent
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  //holding a reference of this user
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//for admin route that gives all users
exports.adminAllUser = BigPromise(async (req, res, next) => {
  //send all the data for the admin
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

//admin gets a single user based on ID from the DB
exports.admingetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new CustomError("No user found", 400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  //as user will send a data so we need to hold it as an object and use it later
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  //holding a reference of this user
  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  //check if the user is present or not
  if (!user) {
    return next(new CustomError("No such user found", 401));
  }

  //if user is present
  const imageId = user.photo.id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
  });
});

//manager all users without sending all data of users like ont showing the personal details
exports.managerAllUser = BigPromise(async (req, res, next) => {
  //send all the data for the manager
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});
