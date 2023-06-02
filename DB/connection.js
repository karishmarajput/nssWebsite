const mongoose = require("mongoose");
const URI =
  "mongodb+srv://Admin:Admin@cluster0.2aegxgx.mongodb.net/?retryWrites=true&w=majority";

const connectDB = async () => {
  await mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("db connected...");
};
module.exports = connectDB;
