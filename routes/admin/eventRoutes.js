const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");
const User = require("../../models/user");
const Event = require("../../models/event");
const jwt = require("jsonwebtoken");
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
      await Event.find()
        .populate("eventLeader", "name")
        .populate("reportWrittenBy", "name")
        .exec()
        .then((event) => {
          res.render("eventDisplay", { events: event });
        });
    } catch (error) {
      console.error("Error fetching user list:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/:eventId", authenticateAdmin, async (req, res) => {
    const eventId = req.params.eventId;
    try {
      const event = await Event.findOne({ _id: eventId })
        .populate("eventLeader", "name")
        .populate("reportWrittenBy", "name")
        .populate("organisers", "vec name")
        .populate("participants", "vec name");
      res.render("eventDetails", { event });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

app.delete(
    "/deleteEvent",
    authenticateAdmin,
    async (req, res) => {
      try {
        const { eventId } = req.body;
        const deletedEvent = await Event.findByIdAndDelete(eventId);
        if (!deletedEvent) {
          return res.status(404).json({ error: "Event not found" });
        }else{
          const users = await User.find({ eventsAttended: eventId });
          const organiser = await User.find({ eventsOrganised: eventId });
          users.forEach(async (user) => {
            const eventIndex = user.eventsAttended.findIndex((eventId) => eventId.toString() === deletedEvent._id.toString());
            if (eventIndex !== -1) {
              user.eventsAttended.splice(eventIndex, 1);
              await user.save();
            }
          });
          organiser.forEach(async (user) => {
            const eventIndex = user.eventsOrganised.findIndex((eventId) => eventId.toString() === deletedEvent._id.toString());
            if (eventIndex !== -1) {
              user.eventsOrganised.splice(eventIndex, 1);
              await user.save();
            }
          });
  
          return res.status(200).json({ message: "Event deleted successfully" });
        }
        
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  
  app.post("/updateEvent", async (req, res) => {
    console.log(req.body);
    const { eventId, organisersHr, hours, parti } = req.body;
    console.log(parti);
    let participants = [];
    let maleParti = 0;
    let femaleParti = 0;
  
    for (let i = 0; i < parti.length; i++) {
      try {
        const user = await User.findOne({ vec: parti[i] });
  
        if (user) {
          participants.push(user);
          if (user.gender === "Male") {
            maleParti += 1;
          } else {
            femaleParti += 1;
          }
        } else {
          console.log("User not found");
        }
      } catch (error) {
        console.error("Error finding user:", error);
      }
    }
  
    console.log(participants);
  
    let totalParti = maleParti + femaleParti;
  
    try {
      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { organisersHr, hours },
        { new: true }
      );
  
      const eventParticipants = updatedEvent.participants.concat(participants);
      updatedEvent.participants = eventParticipants;
      updatedEvent.totalPart =
        parseInt(updatedEvent.totalPart) + parseInt(totalParti);
      updatedEvent.malePart =
        parseInt(updatedEvent.malePart) + parseInt(maleParti);
      updatedEvent.femalePart =
        parseInt(updatedEvent.femalePart) + parseInt(femaleParti);
  
      await updatedEvent.save(); // Save the updated event
      for (let i = 0; i < parti.length; i++) {
        await User.findOne({ vec: parti[i] })
          .then((user) => {
            if (user) {
              user.eventsAttended.push(updatedEvent);
              return user.save();
            } else {
              console.log("User not found");
            }
          })
          .catch((error) => {
            console.error("Error finding user:", error);
          });
      }
      res.json({ message: "Event updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error updating event" });
    }
  });
  
  module.exports = app;
  