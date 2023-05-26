const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
  vec: {
    type: String,
    required: true,
    unique: true 
  },
  name: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  div: {
    type: String,
    required: true
  },
  sem: {
    type: String,
    required: true
  },
  contactNo:{
    type: Number,
    required: true
  },
  nameOfClg: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  bloodGroup:{
    type: String,
    required: true
  },
  gender:{
    type: String,
    required: true
  },
  address: {
    type: String,
    default: null
  },
  yearInNss:{
    type: Number,
    required: true
  },
  campAttended: {
    type: String,
    required: true
  },
  fitIndiaHr: {
    type: Number,
    required: true,
    default:0
  },
  educationForAllHr: {
    type: Number,
    required: true,
    default:0
  },
  animalWellfareHr: {
    type: Number,
    required: true,
    default:0
  },
  diasterManagementHr: {
    type: Number,
    required: true,
    default:0
  },
  greenInitiativeHr: {
    type: Number,
    required: true,
    default:0
  },
  clHr: {
    type: Number,
    required: true,
    default:0
  },
  universityHr: {
    type: Number,
    required: true,
    default:0
  },
  TotalHr: {
    type: Number,
    required: true,
    default:0
  },
  password: {
    type: String,
    required: true
  },
  eventsAttended: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }
  ],
  eventsOrganised: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }
  ],

});

userSchema.pre('save', async function (next) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;