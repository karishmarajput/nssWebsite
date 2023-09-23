const express = require("express");
const Event = require("./models/event");
const connectDB = require("./DB/connection");
const cookieParser = require("cookie-parser");
const app = express();
const port = 5001;
const cors = require("cors");
var favicon = require("serve-favicon");
var path = require("path");


// connecting DB
connectDB();

// middleware
app.use(favicon(path.join(__dirname, "public", "/images/nss_logo.png")));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));
app.set("views", path.join(__dirname, "/public/views"));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());


// routes
const userRoutes = require("./routes/userRoute");
const adminRoutes = require("./routes/admin/admin");
const eventRoutes = require("./routes/eventRoutes")
app.use("/admin",adminRoutes)
app.use("/user", userRoutes);
app.use("/events",eventRoutes)

app.get("/", async (req, res) => {
  try {
    latestEvents = [];
    const eventList = await Event.find(
      {},
      "eventName eventDate venue content eventLeader totalPart category imagePath"
    );
    function newEvents() {
      NewListCount = 0;
      EventListCount = eventList.length - 1;
      while (NewListCount < 6 && EventListCount >= 0) {
        latestEvents[NewListCount] = eventList[EventListCount];
        NewListCount++;
        EventListCount--;
      }
    }
    newEvents();

    res.render("index", { posts: latestEvents });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.post('/logout', (req, res) => {
  res.cookie('authToken', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  res.redirect('/');
});



app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});