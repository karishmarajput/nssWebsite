const express = require("express");
const Event = require("./models/event");
const User = require("./models/user");
const connectDB = require("./DB/connection");
const cookieParser = require("cookie-parser");
const app = express();
const port = 3000;
const cors = require("cors");
var favicon = require("serve-favicon");
var path = require("path");
const fs = require('fs');


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
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
const PDFDocument = require('pdfkit');
app.post("/generate-csv", async (req, res) => {
  try {
      const users = await User.find().populate('eventsAttended').populate('eventsOrganised');

      // CSV header
      let csv = 'Name,VEC,Event Name,Event Date,Hours,Category\n';

      users.forEach(user => {
          const name = user.name;
          const vec = user.vec;

          // Events Attended
          user.eventsAttended.forEach(event => {
              const eventName = event.eventName;
              const eventDate = formatDate(event.eventDate);
              const hours = event.hours;
              const category = event.category;

              // Append data to CSV
              csv += `"${name}","${vec}","${eventName}","${eventDate}","${hours}","${category}"\n`;
          });

          // Events Organised
          user.eventsOrganised.forEach(event => {
              const eventName = event.eventName;
              const eventDate = formatDate(event.eventDate);
              const organisersHr = event.organisersHr;
              const category = event.category;

              // Append data to CSV
              csv += `"${name}","${vec}","${eventName}","${eventDate}","${organisersHr}","${category}"\n`;
          });
      });

      // Write CSV content to file
      const csvFilePath = 'volunteers.csv';
      fs.writeFileSync(csvFilePath, csv);

      res.status(200).download(csvFilePath, (err) => {
          if (err) {
              console.error(err);
              res.status(500).json({ error: "Failed to generate CSV" });
          }
          // Delete the temporary CSV file after download
          // fs.unlinkSync(csvFilePath);
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
  }
});
  app.post("/generate", async (req, res) => {
    console.log('hi')
    try {
        
        const users = await User.find()
        .populate("eventsAttended", "eventName eventDate hours category")
        .populate("eventsOrganised", "eventName eventDate organisersHr category");

        const doc = new PDFDocument();
        const pdfFilePath = 'volunteer.pdf';
        doc.pipe(fs.createWriteStream(pdfFilePath));

        doc.fontSize(20).text('Volunteers Information', { align: 'center' }).moveDown();

        users.forEach(user => {
          doc.fontSize(14).text(`Name: ${user.name}`);
          doc.text(`VEC: ${user.vec}`);
          // Add more fields as needed
          doc.moveDown();

          // Table header
          doc.font('Helvetica-Bold').fontSize(12);
          doc.text('Event Name', 50, doc.y, { width: 200, align: 'left' });
          doc.text('Event Date', 250, doc.y, { width: 150, align: 'left' });
          doc.text('Hours', 400, doc.y, { width: 50, align: 'left' });
          doc.text('Category', 500, doc.y, { width: 100, align: 'left' });
          doc.moveDown();

          // Table rows - Events Attended
          doc.font('Helvetica').fontSize(10);
          user.eventsAttended.forEach(event => {
              doc.rect(50, doc.y, 200, 20).stroke();  // Event Name cell
              doc.rect(250, doc.y, 150, 20).stroke(); // Event Date cell
              doc.rect(400, doc.y, 50, 20).stroke();  // Hours cell
              doc.rect(500, doc.y, 100, 20).stroke(); // Category cell

              doc.text(event.eventName, 50, doc.y + 5, { width: 200, align: 'left' });
              doc.text(formatDate(event.eventDate), 250, doc.y + 5, { width: 150, align: 'left' });
              doc.text(event.hours.toString(), 400, doc.y + 5, { width: 50, align: 'left' });
              doc.text(event.category, 500, doc.y + 5, { width: 100, align: 'left' });
              doc.moveDown();
          });

          // Table rows - Events Organised
          user.eventsOrganised.forEach(event => {
              doc.rect(50, doc.y, 200, 20).stroke();  // Event Name cell
              doc.rect(250, doc.y, 150, 20).stroke(); // Event Date cell
              doc.rect(400, doc.y, 50, 20).stroke();  // Hours cell
              doc.rect(500, doc.y, 100, 20).stroke(); // Category cell

              doc.text(event.eventName, 50, doc.y + 5, { width: 200, align: 'left' });
              doc.text(formatDate(event.eventDate), 250, doc.y + 5, { width: 150, align: 'left' });
              doc.text(event.organisersHr.toString(), 400, doc.y + 5, { width: 50, align: 'left' });
              doc.text(event.category, 500, doc.y + 5, { width: 100, align: 'left' });
              doc.moveDown();
          });

          doc.moveDown(); // Add space between users
      });

        doc.end();

        res.status(200).download(pdfFilePath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to generate PDF" });
            }
            // Delete the temporary PDF file after download
            // fs.unlinkSync(pdfFilePath);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// app.post("/generate",async(req,res)=>{
//   console.log('hi')
  
//   res.status(200).json({ message: "hello" });
// })
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