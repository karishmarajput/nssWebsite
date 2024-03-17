const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");;
var path = require("path");
const secretKey =process.env.SECRET_CODE; 
const authenticateAdmin = async (req, res, next) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    try {
      const decoded = jwt.verify(authToken, secretKey);
      const admin = await Admin.findOne({ username: decoded.username });
      if (!admin) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.admin = admin;
      next();
    } catch (err) {
        console.log(err)
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  app.get("", authenticateAdmin, (req, res) => {
    res
      .status(200)
      .sendFile(path.join(__dirname, "public", "../../../public/pages/addUser.html"));
  });
  app.post("", authenticateAdmin, async (req, res) => {
    try {
      const {
        vec,
        name,
        branch,
        sem,
        div,
        contactNo,
        nameOfClg,
        dob,
        bloodGroup,
        gender,
        address,
        yearInNss,
        batch,
        password,
      } = req.body;
      const existingUser = await User.findOne({ vec });
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      const newUser = new User({
        vec,
        name,
        branch,
        div,
        sem,
        contactNo,
        nameOfClg,
        dob,
        bloodGroup,
        gender,
        address,
        yearInNss,
        batch,
        password,
      });
      await newUser.save();
      res.status(201).json({ success:true,message: "User created successfully" });
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).json({  success:false,error: "Internal server error" });
    }
  });
  const fs = require('fs');
  const csv = require('csv-parser');
  app.post("/updateVec",authenticateAdmin,async(req,res)=>{
    const csvFilePath = 'user_data.csv';
    const updatedUserMap = new Map();
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        updatedUserMap.set(row.vec, row.newVec);
      })
    .on('end',async () => {
      console.log(updatedUserMap)
    for (const [vec, newVec] of updatedUserMap.entries()) {
      const filter = { vec: vec };
      const update = { $set: { vec: newVec } };
      
      const result = await User.updateOne(filter, update);

      if (result.modifiedCount > 0) {
        console.log(`Updated userId ${vec} to ${newVec}`);
      } else {
        console.log(`User ${vec} not found in the collection.`);
      }
    }
  } )
  })
  
  
  module.exports = app;
  