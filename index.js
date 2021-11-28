const app = require("./app"); //importing app from appjs
require("dotenv").config(); //requiring from env file

app.listen(process.env.PORT, () => {
  console.log(`SERVER UP AND RUNNING ON PORT ${process.env.PORT}`);
});
