const express = require("express");
const mongoose = require("mongoose");
const Admin = require("./models/admin");
const User = require("./models/user");
const Event = require("./models/event");
const connectDB = require("./DB/connection");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const port = 5000;
const multer = require("multer");
const cors = require("cors");

var favicon = require("serve-favicon");
var path = require("path");
const Camp = require("./models/camp");
const secretKey = "notmebutyou";
connectDB();
app.use(favicon(path.join(__dirname, 'public', '/images/nss_logo.png')))
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));
app.set("views", path.join(__dirname, "/public/views"));
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

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
    res.status(401).json({ error: "Unauthorized" });
  }
};



app.get("/", async (req, res) => {
  try {
    const eventList = await Event.find({}, 'eventName eventDate venue content eventLeader totalPart category imagePath');
    res.render('index', { posts: eventList });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/admin',(req,res)=>{
  res.sendFile(path.join(__dirname, 'public','pages/adminLogin.html'));
})
app.get('/adminDashboard',authenticateAdmin,(req,res)=>{
  res.status(200).sendFile(path.join(__dirname, "public", "pages/adminDashboard.html"));
})
app.get('/admin/addAdmin',(req,res)=>{
  res.status(200).sendFile(path.join(__dirname,'public','pages/addAdmin.html'))
})
app.post('/admin/addAdmin',authenticateAdmin, async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(409).json({ error: 'Admin already exists' });
      }
      const admin = new Admin({ username, password });
      await admin.save();
      res.json({ message: 'Admin created successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
});
app.post("/admin", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const authToken = jwt.sign({ username: admin.username }, secretKey, {
      expiresIn: "1h",
    });
    res.cookie("authToken", authToken, { httpOnly: true });
    res.status(200).sendFile(path.join(__dirname, "public", "pages/adminDashboard.html"));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/admin/addevent", authenticateAdmin, async (req, res) => {
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

const upload = multer({ storage: storage });

app.post("/admin/addevent", upload.single("eventImage"), async (req, res) => {
  console.log(req.body);
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
  totalPart = parseInt(parti.length) + parseInt(organiser.length);
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
          if (user.gender == "M") {
            malePart += 1;
          } else {
            femalePart += 1;
          }
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
          organisers.push(user);
          if (user.gender == "M") {
            malePart += 1;
          } else {
            femalePart += 1;
          }
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
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/admin/userDisplay", authenticateAdmin, async (req, res) => {
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

app.get("/admin/adduser", authenticateAdmin, (req, res) => {
  res
    .status(200)
    .sendFile(path.join(__dirname, "public", "pages/addUser.html"));
});
app.post("/admin/adduser", authenticateAdmin, async (req, res) => {
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
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/admin/userDisplay/:vec", authenticateAdmin, (req, res) => {
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
          batch:user.batch,
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
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

app.get("/admin/eventDisplay", authenticateAdmin, async (req, res) => {
  try {
    await Event.find().populate("eventLeader", "name").populate("reportWrittenBy", "name").exec()
      .then((event) => {
        res.render("eventDisplay", { events: event });
      });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/admin/eventDisplay/:eventId',authenticateAdmin,async(req,res)=>{
  const eventId = req.params.eventId;
  try{
    const event = await Event.findOne({_id: eventId}).populate('organisers', 'vec name').populate('participants','vec name');
    res.render('eventDetails', { event });
  } 
    catch(error) {
      res.status(500).json({ error: 'Internal server error' });
    };
})

app.get('/admin/campDetails',authenticateAdmin,async(req,res)=>{
  try {
    const userList = await User.find({}, 'vec name');
    res.render('campForm', { users: userList });
  } catch (error) {
    console.error('Error fetching user list:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/admin/campDetails',authenticateAdmin,async(req,res)=>{
  console.log(req.body)
  let {
    campYear,
    fromDate,
    toDate,
    campSite,
    address,
    preCampActivities,
    activityDaywise,
    parti
  } = req.body;
  const existingCamp = await Admin.findOne({campYear: campYear});
  if (existingCamp) {
    return res.status(409).json({ error: `Camp Details for ${campYear} already exists` });
  }
  attendedBy = []
  for(let i =0; i < parti.length;i++){
    await User.findOne({ vec: parti[i] })
    .then(user => {
      if (user) {
        attendedBy.push(user);
        return user.save();
      } else {
        console.log('User not found');
      }
    })
    .catch(error => {
      console.error('Error finding user:', error);
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
      attendedBy
    })
    await camp.save();
    for (let i = 0; i < parti.length; i++) {
      try {
        const user = await User.findOne({ vec: parti[i] });
        
        if (user) {
          user.campAttended = campYear;
          await user.save();
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.error(error);
      }
    }
    
  }catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Internal server error' });
  }
  res.status(200).json({message:'Camp Deatils successfully added'})
})
app.get('/admin/showCampDetails',authenticateAdmin,async(req,res)=>{
  try {
    await Camp.find().populate("attendedBy", "vec name").exec()
      .then((camp) => {
        res.render("campDisplay", { camp });
      });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})
app.get('/admin/showCampDetails/:campId',authenticateAdmin,async(req,res)=>{
  const campId = req.params.campId;
  try{
    const camp = await Camp.findOne({_id: campId}).populate('attendedBy', 'vec name');
    res.render('campDetails', { camp });
  } 
    catch(error) {
      res.status(500).json({ error: 'Internal server error' });
    };
})
app.delete('/admin/campDisplay/deleteCamp',authenticateAdmin,async(req,res)=>{
  try {
    const { campId } = req.body;
    const deletedCamp = await Camp.findByIdAndDelete(campId);
    if (!deletedCamp) {
      return res.status(404).json({ error: 'Camp Details not found' });
    }
    return res.status(200).json({ message: 'Camp Details deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})
app.delete('/admin/eventDisplay/deleteEvent',authenticateAdmin,async(req,res)=>{
  try {
    const { eventId } = req.body;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

app.post('/admin/eventDisplay/updateEvent', async(req, res) => {
  const { eventId, organisersHr, hours} = req.body;
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { organisersHr, hours},
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating event' });
  }
});
app.get('/admin/users',authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().populate("eventsAttended", "hours")
    .populate("eventsOrganised", "organisersHr");
    res.json(users);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/admin/events',authenticateAdmin, async (req, res) => {
  try {
    const event = await Event.find()
    res.json(event);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/userLogin',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname,'public','pages/userLogin.html'))
})

app.listen(port, () => {       
    console.log(`Now listening on port ${port}`); 
});
