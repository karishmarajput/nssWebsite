const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  campYear: {
    type: Number,
    unique: true,
    required: true,
  },
  
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  campSite: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  preCampActivities: {
    type: String,
    required: true
  },
  activityDaywise: [
    {
        type: String,
        required: true
      
    }
  ],
  attendedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

const Camp = mongoose.model('Camp', campSchema);

module.exports = Camp;
