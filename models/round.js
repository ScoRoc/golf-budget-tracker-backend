var mongoose = require('mongoose');

var roundSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teeboxId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teebox',
  },
  date: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  teamScore: {
    type: Boolean,
    required: true
  },
  price: {
    type: Number,
    // required: true
    required: false
  },
  notes: {
    type: String,
    maxLength: 250
  },
  handicapDifferential: {
    type: Number
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

var Round = mongoose.model('Round', roundSchema);

module.exports = Round;
