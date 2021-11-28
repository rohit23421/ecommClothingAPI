const BigPromise = require("../middlewares/bigPromise"); //importing promise as a middleware

//exporting the home controller and using the bigpromise to use the promise or to pass the re,res as function to call bigpormise in the middleware bigpromise file for error handling
exports.home = BigPromise(async (req, res) => {
  // const db = await something();
  res.status(200).json({
    success: true,
    greeting: "Hello from API",
  });
});

exports.homeDummy = BigPromise(async (req, res) => {
  // const db = await something();
  res.status(200).json({
    success: true,
    greeting: "This is another dummy route from API of homecontroller",
  });
});
