var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
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

var Course = mongoose.model('Course', userSchema);

module.exports = Course;
