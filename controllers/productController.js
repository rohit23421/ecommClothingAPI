//test product controller
// exports.testProduct = async (req, res) => {
//   console.log(req.query);
//   res.status(200).json({
//     success: true,
//     greeting: "This is another dummy route test for product",
//   });
// };

const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const cloudinary = require("cloudinary");
const CustomError = require("../utils/customError");
const WhereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
  //images
  let imageArray = [];

  //if files/images are not present in req.files that is not sent by the product uploader
  if (!req.files) {
    return next(new CustomError("Images are required", 401));
  }

  //if files are present
  if (req.files) {
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
          scale: 150,
        }
      );

      //pushing the values
      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imageArray;
  req.body.user = req.user.id;

  //creating a product
  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProduct = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;

  //to count the total number of products before filtering
  const totalCountProduct = await Product.countDocuments();

  const productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productsObj.base;
  const filteredProductNumber = products.length;

  //products.limit().skip() or the below one is same

  productsObj.pager(resultPerPage);
  //saving the product now
  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    filteredProductNumber,
    totalCountProduct,
  });
});
