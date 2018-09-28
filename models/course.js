var mongoose = require('mongoose');

var courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 99
  },
  notes: {
    type: String,
    maxLength: 250
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

var Course = mongoose.model('Course', courseSchema);

module.exports = Course;
