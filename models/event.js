const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
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
  numberOfPart: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
