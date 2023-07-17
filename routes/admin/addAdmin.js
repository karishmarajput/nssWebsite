const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");

const jwt = require("jsonwebtoken");;
var path = require("path");
const Camp = require("../../models/camp");
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
  app.get("/",authenticateAdmin, (req, res) => {
    res
      .status(200)
      .sendFile(path.join(__dirname, "public", "../../../public/pages/addAdmin.html"));
  });
  app.post("/", authenticateAdmin, async (req, res) => {
    const { username, password } = req.body;
  console.log(req.body)
    try {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(409).json({ error: "Admin already exists" });
      }
      const admin = new Admin({ username, password });
      await admin.save();
      res.json({ message: "Admin created successfully" });
    } catch (err) {
      console.log(err)
      res.status(500).json({ error: "Internal server error" });
    }
  });
  module.exports = app;
  