const express = require("express");
const app = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");;
var path = require("path");
const Camp = require("../models/camp");

const secretKey =process.env.SECRET_CODE; 
app.get("/", (req, res) => {
    res
      .status(200)
      .sendFile(path.join(__dirname, "public", "../../public/pages/userLogin.html"));
  });
  async function authenticateUserToken(req, res, next) {
    const authToken = req.cookies.authToken;
    if (!authToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    try {
      const decoded = jwt.verify(authToken, secretKey);
      const user = await User.findOne({ vec: decoded.vec })
      .populate("eventsAttended")
      .populate("eventsOrganised")
      console.log(user)
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user = user;
      next();
    } catch (err) {
      console.log(err)
      res.status(401).json({ error: "Unauthorized" });
    }
  }
  app.post("/",async(req,res)=>{
    const { vec, password } = req.body;
    console.log(req.body)
    try {
      const user = await User.findOne({ vec });
      console.log(user)
      if (!user) {
        return res.status(401).json({ error: "User doesn't exist" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const authToken = jwt.sign({ vec: user.vec }, secretKey, {
        expiresIn: "1h",
      });
      res.cookie("authToken", authToken, { httpOnly: true });
      res
        .status(200)
        .redirect(`/user/${vec}`);
    } catch (err) {
        console.log(err)
      res.status(500).json({ error: "Internal server error" });
    }
  })
  app.get('/:vec', authenticateUserToken, async (req, res) => {
  
    try {
      const user = req.user;
  
      if (user) {
        res.render('userDashboard', { user });
      } else {
        res.status(404).send('User not found');
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  });
  app.get('/:vec/profile', authenticateUserToken, async (req, res) => {
  
    try {
      const user = req.user;
  
      if (user) {
        res.render('userProfile', { user });
      } else {
        res.status(404).send('User not found');
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  });
  const pdf = require('html-pdf');
  app.post('/downloadWorkDiary', authenticateUserToken, async (req, res) => {
    const { vec } = req.body;
    const user = req.user;
  
    if (!user) {
      res.status(404).send('User not found');
    }
  
    const htmlContentPartA = `
    <style>
    *{
        font-size: 8px;
    }
    b{
        font-size: 8px;
    }
    h5{
        font-size: 12px;
    }
  </style>
  <u><h5 align="center" style="font-size:13px">WORK DIARY OF NSS VOLUNTEER- 2023-2024 – Page 1</h5></u><br>
  <div style="display: flex;display: -webkit-box; -webkit-box-pack: center;justify-content: center;width: 100%">
    <div style="width: 49%;border: 1px solid black;;padding-left:.5rem"><br>
        <div style="display: flex;display: -webkit-box; -webkit-box-pack: center;justify-content: center;width: 100%;">
            
            <div style="border: 1px solid black; height: 85px; width: 85px;" align="center">
               <b> Photograph of the volunteer with the College seal and Signature of the Principal</b>
            </div>
        </div>
        
        <div align="left" style="margin-top: 6px">
            <b>Name of the Volunteer</b>  &nbsp;<u>${user.name}</u><br/><br/>
            <b>Residential Address</b>  &nbsp;<u>${user.address}</u><br />
            <b>Contact details No.</b>  &nbsp;<u>${user.contactNo}</u><br />
            <b>Name of the College</b>  &nbsp;<u>${user.nameOfClg}</u> <br />
            
            <div style="display: -webkit-box; -webkit-box-pack: justify;width: 100%;">
            <b>Class :</b> &nbsp;<u>${user.branch}</u>
            <b>Div.:</b> &nbsp;<u>${user.div}</u> <br />
            </div><br>
            <div style="display: -webkit-box; -webkit-box-pack: justify;width: 100%;">
            <b>Date of Birth </b> &nbsp;<u>${user.dob.toLocaleDateString("en-GB")}</u>
            <b>Blood Group </b>  &nbsp;<u>${user.bloodGroup}</u></b> <br />
            </div>
  
            <b>Year in NSS </b> &nbsp;<u>${user.yearInNss}</u></b> <br/>
            <b style="margin-left: 20px">Volunteer Enrolment Code - (as per Enrolment List)</b> <br />
            <b style="margin-left:120px">&nbsp;<u>${user.vec}</u></b>
            <div style="display: flex;justify-content: space-around;display: -webkit-box; -webkit-box-pack: justify; padding:3rem;padding-top: 5rem ;padding-bottom:1rem;">
                <div style="border-top: 1px solid black;">Signature of the<br />NSS Volunteer</div>
                <div style="border-top: 1px solid black;">Signature of the<br />NSS Programme Officer</div>
            </div>
        </div>
    </div>
    <div style="width: 49%;border: 1px solid black;padding:.5rem">
            <p align="center"><b><u>YEAR – 2023-2024</u><br/><br/>UNIVERSITY NSS CELL USE ONLY</b></p>
        <div align="left"><b> Diary Checked by:&nbsp; _______________________________________</b></div>
        <p align="left"> <b>Date: __________________________________ </b></p>
        <p align="left"> <b>Total hours completed by Volunteers: __________________</b></p>
        <p align="left"> <b>Comment if any: _________________________________________ 
            _____________________________________________________________ 
            _____________________________________________________________ 
            _____________________________________________________________
            _____________________________________________________________ 
            _____________________________________________________________ 
            _____________________________________________________________
            _____________________________________________________________ 
            _____________________________________________________________ 
            _____________________________________________________________</b>
        </p>
        <div style="display: flex;justify-content: space-around;display: -webkit-box; -webkit-box-pack: justify; padding:3rem;padding-top: 5rem ;padding-bottom:1rem;">
            <div>Seal</div>
            <div>Signature <br/>Dist/Area Co-ordinator</div>
        </div>
  
    </div>
  </div>
  
    `;
  let htmlContentPartB= ''
  if (user.campAttended == 2022){
    const camp = await Camp.findOne({ campYear: user.campAttended })
    htmlContentPartB =`
    <style>
    .dayDetail{
      min-height: 5rem;
    }
    </style>
    <div style="display: flex;display: -webkit-box; -webkit-box-pack: center;justify-content: center;width: 100%;">
    <div style="width: 48.2%;padding:.5rem;border: 1px solid black;">
        <h3 align="center">RESIDENTIAL SPECIAL CAMP (SEVEN DAYS)</h3><p style="text-align:center"><b> Year - 2023-2024</b></p>
        <p style="text-align:center;margin-left: 20px"><b>(The Camp must start by 12.00 noon. on 1st Day and it
            will conclude at 3.00 p.m. on 7th Day)
        </b></p>
        <div style="margin-left: 2px;text-align: left;margin-top: 20px"><b>Duration <u>__7__</u>Days, From 
                <u>&nbsp;${camp.fromDate.toLocaleDateString("en-GB")}</u> To <u>&nbsp;${camp.toDate.toLocaleDateString("en-GB")}</u></b></div> <br />
        <div style="text-align: left;line-height:1rem"><b> Camp Site</b> <u>&nbsp;${camp.campSite}</u></div><br>
        <div style="text-align: left; display: flex;flex-wrap:wrap;line-height:3remrem"><b>(Address) </b><u>&nbsp;${camp.address}</u></div><br><br>
        <div style="text-align: left"><b>PRE CAMP ACTIVITIES (If any) :-</b> <u>&nbsp ${camp.preCampActivities}</u></div> <br />
        <p style="text-align: center"><b><u>DAILY ACTIVITIES OF THE CAMP</u></b><p> <br />
        <div class="dayDetail" style="text-align: left;"><b>1st Day </b><u>&nbsp;${camp.activityDaywise[0]}</u></div> <br />
        <div class="dayDetail" style="text-align: left;"><b>2nd Day </b><u> &nbsp;${camp.activityDaywise[1]}</u></div>
        
        
    </div>
    <div style="width: 49.05%;padding:.25rem;border: 1px solid black;padding:.5rem">
    <div style="margin-top: 10px"><b>3rd Day</b> <u>&nbsp;${camp.activityDaywise[2]}</u></div> <br />
        <div class="dayDetail"><b>4th Day </b><u>&nbsp;${camp.activityDaywise[3]}</u></div> <br />
        <div class="dayDetail"><b>5th Day </b><u>&nbsp;${camp.activityDaywise[4]}</u></div> <br />
        <div class="dayDetail"><b>6th Day </b><u>&nbsp;${camp.activityDaywise[5]}</u></div> <br />
        <div class="dayDetail"><b>7th Day </b><u>&nbsp;${camp.activityDaywise[6]}</u></div> <br />
        <div ><b>Date: </b></div> <br /><br><br>
        <div style="display: flex;justify-content: space-around;display: -webkit-box; -webkit-box-pack: justify; padding:1rem;">
          <div>${user.name}<br><div style="border-top: 1px solid black;"><b>Name of the Volunteer</b></div></div>
          <div><br><div style="border-top: 1px solid black;"><b>Signature of Volunteer</b></div></div>
      </div>
    </div>
  </div>
    `
  }else{
      htmlContentPartB =`
      <div style="display: flex;display: -webkit-box; -webkit-box-pack: center;justify-content: center;width: 100%;">
      <div style="width: 48.2%;padding:.5rem;border: 1px solid black;">
          <h3 align="center">RESIDENTIAL SPECIAL CAMP (SEVEN DAYS)</h3><p style="text-align:center"><b> Year - 2023-2024</b></p>
          <p style="text-align:center;margin-left: 20px"><b>(The Camp must start by 12.00 noon. on 1st Day and it
              will conclude at 3.00 p.m. on 7th Day)
          </b></p>
          <div style="margin-left: 2px;text-align: left;margin-top: 20px"><b>Duration <u>_______</u>Days, From 
                  <u>&nbsp;_________</u> To <u>&nbsp;_________</u></b></div> <br />
          <div style="text-align: left;line-height:1rem"><b> Camp Site</b> <u>&nbsp;_________________________</u></div><br>
          <div style="text-align: left; display: flex;flex-wrap:wrap;line-height:3remrem"><b>(Address) </b><u>&nbsp;_________________________________________________<br> _____________________________________________________________</u></div><br><br>
          <div style="text-align: left"><b>PRE CAMP ACTIVITIES (If any) :-</b> <u>&nbsp______________________ <br> _____________________________________________________________ <br> _____________________________________________________________ <br> _____________________________________________________________ <br> _____________________________________________________________ <br> ______________________________________________________________</u></div> <br />
          <p style="text-align: center"><b><u>DAILY ACTIVITIES OF THE CAMP</u></b><p> <br />
          <div style="text-align: left;"><b>1st Day <u>&nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></b></div> <br />
          <div style="text-align: left;"><b>2nd Day <u> &nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></b></div>
          
          
      </div>
      <div style="width: 49.05%;padding:.25rem;border: 1px solid black;padding:.5rem"><b>
      <div style="margin-top: 10px">3rd Day <u>&nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></div> <br />
          <div>4th Day <u>&nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></div> <br />
          <div>5th Day <u>&nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></div> <br />
          <div>6th Day <u>&nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></div> <br />
          <div>7th Day <u>&nbsp;___________________________________________________ <br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________<br> _____________________________________________________________</u></div> <br />
          <div>Date: </div> <br /></b><br><br>
          <div style="display: flex;justify-content: space-around;display: -webkit-box; -webkit-box-pack: justify; padding:1rem;">
            <div style="border-top: 1px solid black;"><b>Name of the Volunteer</b></div>
            <div style="border-top: 1px solid black;"><b>Signature of Volunteer</b></div>
        </div>
      </div>
    </div>
      `
    }
  
  
    const pdfOptions = {
      format: 'A4',border: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '40px'
    },
    };
    htmlContent = htmlContentPartA+ htmlContentPartB
  
    pdf.create(htmlContent, pdfOptions).toStream((err, stream) => {
      if (err) {
        console.log('Error generating PDF:', err);
        res.status(500).send('Error generating PDF');
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="work_diary.pdf"');
        stream.pipe(res);
      }
    });
  });
  module.exports = app;