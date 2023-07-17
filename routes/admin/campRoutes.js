const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");
const User = require("../../models/user");

const jwt = require("jsonwebtoken");;

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

  app.get("/campDetails", authenticateAdmin, async (req, res) => {
    try {
      const userList = await User.find({}, "vec name");
      res.render("campForm", { users: userList });
    } catch (error) {
      console.error("Error fetching user list:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/campDetails", authenticateAdmin, async (req, res) => {
    let {
      campYear,
      fromDate,
      toDate,
      campSite,
      address,
      preCampActivities,
      activityDaywise,
      parti,
    } = req.body;
    console.log(req.body)
    const existingCamp = await Admin.findOne({ campYear: campYear });
    if (existingCamp) {
      return res
        .status(409)
        .json({ error: `Camp Details for ${campYear} already exists` });
    }else{
    attendedBy = [];
    for (let i = 0; i < parti.length; i++) {
      await User.findOne({ vec: parti[i] })
        .then((user) => {
          if (user) {
            attendedBy.push(user);
            return user.save();
          } else {
            console.log("User not found");
          }
        })
        .catch((error) => {
          console.error("Error finding user:", error);
        });
    }
    try {
      const camp = new Camp({
        campYear,
        fromDate,
        toDate,
        campSite,
        address,
        preCampActivities,
        activityDaywise,
        attendedBy,
      });
      await camp.save();
      for (let i = 0; i < parti.length; i++) {
        try {
          const user = await User.findOne({ vec: parti[i] });
  
          if (user) {
            user.campAttended = campYear;
            await user.save();
          } else {
            console.log("User not found");
          }
        } catch (error) {
          console.error(error);
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal server error" });
    }
    res.status(200).json({ message: "Camp Deatils successfully added" });
  }});
  app.get("/showCampDetails", authenticateAdmin, async (req, res) => {
    try {
      await Camp.find()
        .populate("attendedBy", "vec name")
        .exec()
        .then((camp) => {
          res.render("campDisplay", { camp });
        });
    } catch (error) {
      console.error("Error fetching user list:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get(
    "/showCampDetails/:campId",
    authenticateAdmin,
    async (req, res) => {
      const campId = req.params.campId;
      try {
        const camp = await Camp.findOne({ _id: campId }).populate(
          "attendedBy",
          "vec name"
        );
        res.render("campDetails", { camp });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app.delete(
    "/campDisplay/deleteCamp",
    authenticateAdmin,
    async (req, res) => {
      try {
        const { campId } = req.body;
        const deletedCamp = await Camp.findByIdAndDelete(campId);
        if (!deletedCamp) {
          return res.status(404).json({ error: "Camp Details not found" });
        }
        return res
          .status(200)
          .json({ message: "Camp Details deleted successfully" });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  module.exports = app;
  