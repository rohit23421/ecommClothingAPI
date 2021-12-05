const express = require("express");
require("dotenv").config(); //requiring from env file
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

//for swagger docs
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//regular middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//for cookies and fileUpload middleware
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

//just a temp check
app.set("view engine", "ejs");

//morgan middleware which is a logger
app.use(morgan("tiny"));

//importing routes here
const home = require("./routes/home"); //importing home route as home here
const user = require("./routes/user");
const product = require("./routes/product");
const payment = require("./routes/payment");

//router middleware
app.use("/api/v1", home); //means to go to /api/v1 and them {home} function will take care of it and will execute
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", payment);

app.get("/signuptest", (req, res) => {
  res.render("signupTest");
});

//exporting appjs to indexjs
module.exports = app;
