const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    unique: true 
  },
  fname: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    required: true
  },
  educationHr: {
    type: Number,
    required: true,
    default:0
  },
  healthHr: {
    type: Number,
    required: true,
    default:0
  },
  animalHr: {
    type: Number,
    required: true,
    default:0
  },
  cyberHr: {
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
  eventsAttended: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }
  ]
});

const User = mongoose.model('User', userSchema);

module.exports = User;