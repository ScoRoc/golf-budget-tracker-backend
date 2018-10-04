require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Course = require('../models/course');
var Round = require('../models/round');

router.get('/:id', (req, res) => {
  Round.find({userId: req.params.id}, function(err, rounds) {
    if (err) {
      console.log(err);
    } else {
      res.json({rounds});
    }
  })
});

router.post('/', (req, res) => {
  const { course, teebox, date, score, price, notes, user } = req.body;
  Round.create({
    courseId: course._id,
    teeboxId: teebox._id,
    date,
    score,
    price,
    notes,
    userId: user._id
  }, function(err, newRound) {
    if (err) {
      console.log("GOT AN ERROR CREATING THE COURSE")
      console.log(err)
      res.send(err)
    } else {
      res.json({newRound});
    }
  });
});

router.put('/', (req, res) => {
  const { roundId, course, teebox, date, score, price, notes } = req.body;
  Round.findById(roundId, (err, round) => {
    round.courseId = course._id;
    round.teeboxId = teebox._id;
    round.date = date;
    round.score = score;
    round.price = price;
    round.notes = notes;
    round.save((err, updatedRound) => {
      res.json({updatedRound});
    });
  });
});

router.delete('/', (req, res) => {
  Round.findByIdAndRemove(req.body.id, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.send({msg: 'deleted'});
    }
  });
});

module.exports = router;
