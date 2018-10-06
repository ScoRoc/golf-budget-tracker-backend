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
    require: true
  },
  price: {
    type: Number,
    require: true
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
