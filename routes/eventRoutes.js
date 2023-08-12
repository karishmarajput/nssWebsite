const express = require("express");
const app = express.Router();
const User = require("./../models/user");
const Event = require("./../models/event");
app.get("/", async (req, res) => {
    try {
      await Event.find()
        .populate("eventLeader", "name")
        .populate("reportWrittenBy", "name")
        .exec()
        .then((event) => {
          res.render("event", { events: event });
        });
    } catch (error) {
      console.error("Error fetching user list:", error);
      res.status(500).json({ error: "Internal server error" });
    }
});
module.exports = app;
  