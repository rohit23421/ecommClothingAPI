const express = require("express");
const router = express.Router();

const { home, homeDummy } = require("../controllers/homeController"); //importing homecontroller as home in the router

//get router from the router to be directed
router.route("/").get(home); //routing to the controller(homecontroller as called here home)
router.route("/dummy").get(homeDummy);

module.exports = router; //exporting the router for further functioning
