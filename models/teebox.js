var mongoose = require('mongoose');

var teeboxSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    require: true
  },
  slope: {
    type: Number,
    require: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

var Teebox = mongoose.model('Teebox', teeboxSchema);

module.exports = Teebox;
