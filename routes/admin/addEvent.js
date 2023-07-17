const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");
const User = require("../../models/user");
const Event = require("../../models/event");
const jwt = require("jsonwebtoken");;

const multer = require("multer");

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
      const userList = await User.find({}, "vec name");
      res.render("eventForm", { users: userList });
    } catch (error) {
      console.error("Error fetching user list:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  const storage = multer.diskStorage({
    destination: "./public/files",
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "-" + Date.now());
    },
  });
  
  let upload = multer({ storage: storage });
  
  app.post("/", upload.single("eventImage"), async (req, res) => {
    let {
      eventName,
      eventDate,
      venue,
      content,
      eventLead,
      organisersHr,
      organiser,
      hours,
      parti,
      category,
      numberOfBenificiar,
      reportBy,
    } = req.body;
    const imagePath = req.file.path;
  
    await User.findOne({ vec: eventLead }).then((user) => {
      eventLeader = user;
    });
    await User.findOne({ vec: reportBy }).then((user) => {
      reportWrittenBy = user;
    });
    
   
  
    let participants = [],
      organisers = [],
      malePart = 0,
      femalePart = 0;
    parti = parti.split(",");
    organiser = organiser.split(",");
  
    for (let i = 0; i < parti.length; i++) {
      await User.findOne({ vec: parti[i] })
        .then((user) => {
          if (user) {
            participants.push(user);
            if (user.gender == "male") {
              malePart += 1;
            } else {
              femalePart += 1;
            }
          } else {
            console.log("User not found");
          }
        })
  
        .catch((error) => {
          console.error("Error finding user:", error);
        });
    }
    for (let i = 0; i < organiser.length; i++) {
      await User.findOne({ vec: organiser[i] })
        .then((user) => {
          if (user) {
            organisers.push(user);
            if (user.gender == "male") {
              malePart += 1;
            } else {
              femalePart += 1;
            }
          } else {
            console.log("User not found");
          }
        })
        .catch((error) => {
          console.error("Error finding user:", error);
        });
    }
    totalPart = malePart+femalePart
    try {
      const event = new Event({
        eventName,
        eventDate,
        venue,
        content,
        eventLeader,
        organisersHr,
        organisers,
        hours,
        participants,
        totalPart,
        malePart,
        femalePart,
        numberOfBenificiar,
        reportWrittenBy,
        category,
        imagePath,
      });
  
      await event.save();
      for (let i = 0; i < parti.length; i++) {
        await User.findOne({ vec: parti[i] })
          .then((user) => {
            if (user) {
              user.eventsAttended.push(event);
              return user.save();
            } else {
              console.log("User not found");
            }
          })
          .catch((error) => {
            console.error("Error finding user:", error);
          });
      }
      for (let i = 0; i < organiser.length; i++) {
        await User.findOne({ vec: organiser[i] })
          .then((user) => {
            if (user) {
              user.eventsOrganised.push(event);
              return user.save();
            } else {
              console.log("User not found");
            }
          })
          .catch((error) => {
            console.error("Error finding user:", error);
          });
      }
      res.json({ message: "Event added successfully" });
    } catch (err) {
      console.log(err)
      res.status(500).json({ error: "Internal server error" });
    }
  });
  module.exports = app;
  