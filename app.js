
const express = require('express'); 
const mongoose = require('mongoose');
const Admin = require('./models/admin');
const User = require('./models/user');
const Event = require('./models/event');
const connectDB = require('./DB/connection')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();              
const port = 5000;    
              
const cors = require('cors')
const fileUpload = require("express-fileupload");
var favicon = require('serve-favicon');
var path = require('path')
const secretKey = 'notmebutyou';
connectDB();

// app.use(favicon(path.join(__dirname, 'public', 'images/verifyDB.png')))
app.set('view engine', 'ejs');

app.use(fileUpload());
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())
app.use(express.static(__dirname + '/public'));
app.set("views", path.join(__dirname, "/public/views"));

//middleware
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {        
    res.status(200).sendFile(path.join(__dirname,'public','pages/index.html'))                                                         
});

//Admin

app.get('/admin',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname,'public','pages/adminLogin.html'))
})
app.get('/admin/addAdmin',(req,res)=>{
  res.status(200).sendFile(path.join(__dirname,'public','pages/addAdmin.html'))
})
app.post('/admin/addAdmin', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Check if the admin already exists
      const existingAdmin = await Admin.findOne({ username });
  
      if (existingAdmin) {
        return res.status(409).json({ error: 'Admin already exists' });
      }
      // Create a new admin
      const admin = new Admin({ username, password });
      await admin.save();
  
      res.json({ message: 'Admin created successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/admin', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Check if the admin exists in the database
      const admin = await Admin.findOne({ username });
  
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isPasswordValid = await bcrypt.compare(password, admin.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Generate and sign the JWT token
      
      const authToken = jwt.sign({ username: admin.username }, secretKey, { expiresIn: '1h' });
  
      // Set the auth token as a cookie
      res.cookie('authToken', authToken, { httpOnly: true });
  
      res.status(200).sendFile(path.join(__dirname,'public','pages/adminDashboard.html'))
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Authorization middleware
const authenticateAdmin = async(req, res, next) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      // Verify and decode the auth token
      const decoded = jwt.verify(authToken, secretKey);
  
      // Check if the decoded username is a valid admin
      const admin = await Admin.findOne({ username: decoded.username });
  
      if (!admin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      // Add the admin object to the request for further use
      req.admin = admin;
  
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
  
  app.get('/admin/addevent', authenticateAdmin, async(req, res) => {
    try {
        // Fetch the user list from the database
        const userList = await User.find({}, 'userid fname lname');
    
        // Render the event form with the user list
        res.render('eventForm', { users: userList });
      } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    // res.status(200).sendFile(path.join(__dirname,'public','pages/eventForm.html'))
  });
  app.post('/admin/addevent',async (req, res) => {
    const { eventName, hours, parti, category } = req.body;
    numberOfPart = parti.length;
    let participants = []
    for(let i =0; i < numberOfPart;i++){
      await User.findOne({ userid: parti[i] })
      .then(user => {
        if (user) {
          participants.push(user);
          if(category == 'animal'){
            user.animalHr = parseInt(user.animalHr)+ parseInt(hours);
          }else if(category == 'health'){
            user.healthHr = parseInt(user.healthHr)+ parseInt(hours);;
          }else if(category == 'cyber'){
            user.cyberHr = parseInt(user.cyberHr)+ parseInt(hours);;
          }else if(category == 'education'){
            user.educationHr = parseInt(user.educationHr)+ parseInt(hours);;
          }else if(category == 'college'){
            user.clHr = parseInt(user.clHr)+ parseInt(hours);;
          }else{
            user.universityHr = parseInt(user.universityHr)+ parseInt(hours);;
          }
          user.TotalHr = parseInt(user.TotalHr)+ parseInt(hours);; 
          console.log(user)
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
      const event = new Event({
        eventName,
        hours,
        participants,
        numberOfPart,
        category,
      });
     console.log(event)
      await event.save();
      for(let i =0; i < numberOfPart;i++){
        await User.findOne({ userid: parti[i] })
        .then(user => {
          if (user) {
            user.eventsAttended.push(event)
            console.log(user)
            return user.save();
          } else {
            console.log('User not found');
          }
        })
        .catch(error => {
          console.error('Error finding user:', error);
        });
      }
      res.json({ message: 'Event added successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.get('/admin/userDisplay',authenticateAdmin,async(req,res) => {
    try {
      // Fetch the user list from the database
      const userList = await User.find({}, 'userid fname lname educationHr healthHr animalHr cyberHr clHr universityHr TotalHr');
  
      // Render the event form with the user list
      res.render('userDisplay', { users: userList });
    } catch (error) {
      console.error('Error fetching user list:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  


//users

app.get('/admin/adduser',authenticateAdmin,(req,res)=>{
    res.status(200).sendFile(path.join(__dirname,'public','pages/addUser.html'))  
})
app.post('/admin/adduser',authenticateAdmin,async(req,res)=>{
    try {
        const { userid,fname, lname} = req.body;
        const existingUser = await User.findOne({ userid });
        console.log(existingUser)
        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
        }
        const newUser = new User({
            userid,
             fname,
             lname,
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
      } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
})
app.get('/admin/userDisplay/:userid', authenticateAdmin,(req, res) => {
  const userid = req.params.userid;
  User.findOne({ userid })
    .populate('eventsAttended')
    .exec()
    .then(user => {
      if (user) {
        const userDetails = {
          userid: user.userid,
          fname: user.fname,
          lname: user.lname,
          educationHr: user.educationHr,
          healthHr: user.healthHr,
          animalHr: user.animalHr,
          cyberHr: user.cyberHr,
          clHr: user.clHr,
          universityHr: user.universityHr,
          totalHour: user.TotalHr,
          eventsAttended: user.eventsAttended.map(event => {
            return {
              eventId: event._id,
              eventName: event.eventName,
              hour: event.hours,
              category: event.category
            };
          })
        };

        res.render('userDetails', { userDetails });
      } else {
        // User not found
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch(error => {
      // Error occurred while fetching user data
      console.error(error); // Log the error for debugging purposes
      res.status(500).json({ error: 'Internal server error' });
    });
});
app.get('/userLogin',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname,'public','pages/userLogin.html'))
})
app.listen(port, () => {       
    console.log(`Now listening on port ${port}`); 
});