const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  }, 
  content: {
    type: String,
    required: true
  },
  eventLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organisersHr: {
    type: Number,
    required: true
  },
  organisers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  hours: {
    type: Number,
    required: true
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  totalPart: {
    type: Number,
    required: true
  },
  malePart: {
    type: Number,
    required: true
  },
  femalePart: {
    type: Number,
    required: true
  },
  numberOfBenificiar: {
    type: Number,
    required: true
  },
  reportWrittenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    required: true
  },
  imagePath: {
    type: String,
    required: true,
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
