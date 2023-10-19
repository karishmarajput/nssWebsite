const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");;
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
app.get("/", authenticateAdmin, async (req, res) => {
    try {
      const users = await User.find()
        .populate("eventsAttended", "hours category")
        .populate("eventsOrganised", "organisersHr category");
      res.render("userDisplay", { users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/:vec", authenticateAdmin, (req, res) => {
    const vec = req.params.vec;
    User.findOne({ vec })
      .populate("eventsAttended")
      .populate("eventsOrganised")
      .exec()
      .then((user) => {
        if (user) {
          const userDetails = {
            vec: user.vec,
            name: user.name,
            branch: user.branch,
            div: user.div,
            sem: user.sem,
            contactNo: user.contactNo,
            nameOfClg: user.nameOfClg,
            dob: user.dob,
            bloodGroup: user.bloodGroup,
            gender: user.gender,
            address: user.address,
            yearInNss: user.yearInNss,
            batch: user.batch,
            campAttended: user.campAttended,
            eventsAttended: user.eventsAttended.map((event) => {
              return {
                eventId: event._id,
                eventName: event.eventName,
                hour: event.hours,
                category: event.category,
              };
            }),
            eventsOrganised: user.eventsOrganised.map((event) => {
              return {
                eventId: event._id,
                eventName: event.eventName,
                organisersHr: event.organisersHr,
                category: event.category,
              };
            }),
          };
  
          res.render("userDetails", { userDetails });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
  app.post("/deleteVol",authenticateAdmin,async(req,res)=>{
    vec = req.body.vec;
    try {
      const deletedUser = await User.findOneAndDelete({ vec: vec });
  
      if (deletedUser) {
        // The user with the specified vec value was found and deleted
        return res.status(200).json({ message: 'User deleted successfully.' });
      } else {
        // No user with the specified vec value was found
        return res.status(404).json({ error: 'User not found.' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred while deleting the user.' });
    }
  })
  module.exports = app;
  