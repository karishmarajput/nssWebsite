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
    default:"Nill"
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
    default: "Fr. Conceicao Rodrigues Institute of Technology"
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
  batch:{
    type: String,
    required: true
  },
  campAttended: {
    type: String,
    default: "Nill"
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
    if (!this.isModified('password')) {
      return next();
    }
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