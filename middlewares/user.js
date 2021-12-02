const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const jwt = require("jsonwebtoken");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  const token =
    req.cookies.token || req.header("Authorization").replace("Bearer ", "");

  //verifying if the token is present or not
  if (!token) {
    return next(new CustomError("Login first to access this page", 401));
  }

  //injecting ID information in the middleware/token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //storing the ID field of the user in req.user so that it can be sent in the URL later when and wherever requried
  req.user = await User.findById(decoded.id);

  next();
});
