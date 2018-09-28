require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Course = require('../models/course');
var Teebox = require('../models/teebox');

router.get('/:id', (req, res) => {
  Course.find({userId: req.params.id}, function(err, courses) {
    if (err) {
      console.log(err);
    } else {
      res.json({courses});
    }
  })
});

router.post('/', (req, res) => {
  const { courseName, notes, user, teeboxes } = req.body;
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
      teeboxes.forEach(teebox => {
        teebox.courseId = newCourse._id;
      });
      Teebox.create(teeboxes, function(err, newTeeboxes) {
        if (err) {
          console.log("GOT AN ERROR CREATING THE COURSE")
          console.log(err)
          res.send(err)
        } else {
          res.json({newCourse, newTeeboxes});
        }
      })
    }
  });
});

router.put('/', (req, res) => {
  const { courseName, notes, courseId } = req.body;
  Course.findById(courseId, (err, course) => {
    course.courseName = courseName;
    course.notes = notes;
    course.save((err, updatedCourse) => {
      res.json({updatedCourse});
    });
  });
});

router.delete('/', (req, res) => {
  Course.findByIdAndRemove(req.body.courseId, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.send({msg: 'deleted'});
    }
  })
});

module.exports = router;
