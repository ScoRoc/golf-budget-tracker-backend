require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Course = require('../models/course');

router.get('/:id', (req, res) => {
  console.log('user: ', req.params.id);
  Course.find({userId: req.params.id}, function(err, courses) {
    if (err) {
      console.log(err);
    } else {
      console.log('courses: ', courses);
      res.json({courses});
    }
  })
});

router.post('/', (req, res) => {
  const { courseName, notes, user } = req.body;
  Course.create({
    courseName,
    notes,
    userId: user._id
  }, function(err, newCourse) {
    if (err) {
      console.log("GOT AN ERROR CREATING THE COURSE")
      console.log(err)
      res.send(err)
    } else {
      console.log('newCourse: ', newCourse);
      res.json({newCourse});
    }
  });
});

module.exports = router;
