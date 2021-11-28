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
app.use(fileUpload());

//morgan middleware which is a logger
app.use(morgan("tiny"));

//importing routes here
const home = require("./routes/home"); //importing home route as home here

//router middleware
app.use("/api/v1", home); //means to go to /api/v1 and them {home} function will take care of it and will execute

//exporting appjs to indexjs
module.exports = app;
