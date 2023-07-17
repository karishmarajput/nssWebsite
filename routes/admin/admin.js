const express = require("express");
const app = express.Router();
const Admin = require("../../models/admin");
const User = require("../../models/user");
const Event = require("../../models/event");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");;
var path = require("path");
const multer = require("multer");
const PDFDocument = require('pdfkit');
const secretKey =process.env.SECRET_CODE; 


const adminUserRoutes = require("./userDisplayRoutes")
const adminEventRoutes = require("./eventRoutes")
const adminAdminRoutes = require("./addAdmin")
const adminAddEvent = require("./addEvent")
const adminCampRoutes = require("./campRoutes")
const adminAddUserRoutes = require("./addUser")


app.use("/eventDisplay",adminEventRoutes)
app.use("/userDisplay",adminUserRoutes)
app.use("/addAdmin",adminAdminRoutes)
app.use("/addevent",adminAddEvent)
app.use("/camp",adminCampRoutes)
app.use("/adduser",adminAddUserRoutes)


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
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "../../../public/pages/adminLogin.html"));
  });
  app.get("/adminDashboard", authenticateAdmin, (req, res) => {
    res
      .status(200)
      .sendFile(path.join(__dirname, "public", "../../../public/pages/adminDashboard.html"));
  });
  
  app.post("/", async (req, res) => {
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
      res
        .status(200)
        .sendFile(path.join(__dirname, "public", "../../../public/pages/adminDashboard.html"));
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  
  app.get("/users", authenticateAdmin, async (req, res) => {
    try {
      const users = await User.find()
        .populate("eventsAttended", "hours")
        .populate("eventsOrganised", "organisersHr");
      res.json(users);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/events", authenticateAdmin, async (req, res) => {
    try {
      const event = await Event.find();
      res.json(event);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  const fs = require('fs');
  
  
  app.get('/generate-pdf',authenticateAdmin, async (req, res) => {
    try {
      const events = await Event.find();
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
      doc.pipe(res);
      let position = 100; 
      const eventSpacing = 50;
      doc.fontSize(32).text("Events 2023-24");
      doc.moveDown(1);
      events.forEach((event,index) => {
        doc.fontSize(20).text(event.eventName);
        doc.image(event.imagePath, { width: 400,align:"center" });
         doc.moveDown(1);
        doc.fontSize(14).text(event.content);
         doc.moveDown(2);
        const contentHeight = doc.heightOfString(event.content);
        const availableHeight = doc.page.height - position;
  
        if (index < events.length - 1 && contentHeight + eventSpacing > availableHeight) {
          doc.addPage();
          position = 50;
        } else {
          position += contentHeight + eventSpacing; 
        }
      });
  doc.end();
      console.log('PDF generated successfully.');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  });
  const storage = multer.diskStorage({
    destination: "./public/files",
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "-" + Date.now());
    },
  });
  let upload = multer({ storage: storage });
  
  

  app.post('/addVolunteerUsingCSV', upload.single('file'),(req,res)=>{
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    fs.createReadStream(file.path)
      .pipe(csvParser())
      .on('data', async(data) => {
        const { vec,name,branch,div,sem,contactNo,dob,bloodGroup,gender,address,yearInNss,batch,password} = data;
        User.findOne({ vec:vec})
            .then(async(user) => {
              if(user){
                console.log(vec+' already exist')
              }else{
                const newUser = new User({
                  vec,
                  name,
                  branch,
                  div,
                  sem,
                  contactNo,
                  dob,
                  bloodGroup,
                  gender,
                  address,
                  yearInNss,
                  batch,
                  password,
                });
                await newUser.save();
                console.log(vec +' created')
              }
               
            })
      })
      .on('end', () => {
        res.json({ message: "Process completed check console for details" });
      });
  
  })
  
  module.exports = app;
  