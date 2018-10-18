require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Course = require('../models/course');
var Round = require('../models/round');
var Teebox = require('../models/teebox');

const quickSortRounds = (rounds, sortBy) => {
  const lesser = [];
  const equal = [];
  const greater = [];
  if (rounds.length < 2) {
    return rounds;
  }
  rounds.forEach(round =>{
    let pivot = rounds[0][sortBy];
    if (round[sortBy] < pivot) {
      lesser.push(round);
    } else if (round[sortBy] === pivot) {
      equal.push(round);
    } else if (round[sortBy] > pivot) {
      greater.push(round);
    }
  });
  return [...quickSortRounds(lesser, sortBy), ...equal, ...quickSortRounds(greater, sortBy)];
};

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  user.toObject();
  const courses = await Course.find({userId: id}).lean();
  const teeboxes = await Teebox.find({userId: id}).lean();
  const rounds = await Round.find({userId: id}).lean();
  courses.forEach(course => {
    course.teeboxes = [];
    course.rounds = [];
    teeboxes.forEach(teebox => {
      if (teebox.courseId.equals(course._id)) {
        course.teeboxes.push(teebox);
      }
    });
    rounds.forEach(round => {
      let roundDate = new Date(round.date);
      round.dateTime = roundDate.getTime();
      if (round.courseId.equals(course._id)) {
        course.rounds.push(round);
        round.courseName = course.courseName;
      }
    })
  });
  res.json({user, courses, rounds: quickSortRounds(rounds, 'dateTime').reverse()});
});

// router.post('/', (req, res) => {
//   const { courseName, notes, user, teeboxes } = req.body;
//   Course.create({
//     courseName,
//     notes,
//     userId: user._id
//   }, function(err, newCourse) {
//     if (err) {
//       console.log("GOT AN ERROR CREATING THE COURSE")
//       console.log(err)
//       res.send(err)
//     } else {
//       teeboxes.forEach(teebox => {
//         teebox.courseId = newCourse._id;
//       });
//       Teebox.create(teeboxes, function(err, newTeeboxes) {
//         if (err) {
//           console.log("GOT AN ERROR CREATING THE COURSE")
//           console.log(err)
//           res.send(err)
//         } else {
//           res.json({newCourse, newTeeboxes});
//         }
//       })
//     }
//   });
// });

// router.put('/', (req, res) => {
//   const { courseName, notes, courseId } = req.body;
//   Course.findById(courseId, (err, course) => {
//     course.courseName = courseName;
//     course.notes = notes;
//     course.save((err, updatedCourse) => {
//       res.json({updatedCourse});
//     });
//   });
// });

// router.delete('/', (req, res) => {
//   const { courseId } = req.body;
//   Teebox.find({courseId}).remove(function(err,) {
//     if (err) {
//       console.log(err);
//     } else {
//       Course.findByIdAndRemove(courseId, function(err) {
//         if (err) {
//           console.log(err);
//         } else {
//           res.send({msg: 'deleted'});
//         }
//       });
//     }
//   });
// });

module.exports = router;
