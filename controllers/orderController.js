const Order = require("../models/order");
const Product = require("../models/product");

const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  //creating an order
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  //find the particular order coming from the url
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  //checking if it is present or not
  if (!order) {
    return next(new CustomError("Please check order ID", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getLoggedInOrder = BigPromise(async (req, res, next) => {
  //find users order who are loggedin
  const order = await Order.find({ user: req.user._id });

  //checking if it is present or not
  if (!order) {
    return next(new CustomError("Please check order ID", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

//admin controllers
exports.adminGetAllOrders = BigPromise(async (req, res, next) => {
  //find orders from the admin
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  //find order by id and grab it
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === "Delivered") {
    return next(new CustomError("Order is already marked for delivered", 401));
  }

  //update the order status comming from body
  order.orderStatus = req.body.orderStatus;

  order.orderItems.forEach(async (prod) => {
    await updateProductStock(prod.product, prod.quantity);
  });

  //saving the order now
  await order.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  //find order by id and grab it
  const order = await Order.findById(req.params.id);

  //saving the order now
  await order.remove();

  res.status(200).json({
    success: true,
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);

  //finding stock
  product.stock = product.stock - quantity;

  //saving it now
  await product.save({ validateBeforeSave: false });
}
