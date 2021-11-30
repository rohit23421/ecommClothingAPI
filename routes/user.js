const express = require("express");
const router = express.Router();

//importing the user controller for signup
const { signup } = require("../controllers/userController");

router.route("/signup").post(signup);

module.exports = router;
