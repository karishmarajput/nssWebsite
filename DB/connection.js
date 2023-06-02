const mongoose = require("mongoose");
const URI =
  "mongodb+srv://fcritnss:u7J78YVINhBck4sR@cluster0.v0voyza.mongodb.net/";

const connectDB = async () => {
  await mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("db connected...");
};
module.exports = connectDB;
