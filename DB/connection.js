const mongoose = require("mongoose");
const URI = "";

const connectDB = async () => {
  await mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("db connected...");
};
module.exports = connectDB;
