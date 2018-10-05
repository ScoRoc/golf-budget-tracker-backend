require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
// var Course = require('../models/course');
var Round = require('../models/round');

const quickSort = array => {
  const lesser = [];
  const equal = [];
  const greater = [];
  if (array.length < 2) {
    return array;
  }
  array.forEach(i =>{
    let pivot = array[0];
    if (i < pivot) {
      lesser.push(i);
    } else if (i === pivot) {
      equal.push(i);
    } else if (i > pivot) {
      greater.push(i);
    }
  });
  return [...quickSort(lesser),...equal,...quickSort(greater)];
};

const findLowest20Scores = rounds => {
  const allScores = quickSort( rounds.map(round => round.score) );
  const lowest20Scores = [];
  console.log('allScores sorted: ', allScores);
  // allScores = quickSort(allScores);
  // console.log('allScores: ', allScores);
  // console.log('$ $$$$$ $$$ %%%% rounds: ', rounds);
  return lowest20Scores;
}

const calculateHandicap = userId => {
  User.findById(userId, (err, user) => {
    Round.find({userId: user._id}, (err, rounds) => {
      // console.log('rounds: ', rounds);
      const lowest20Scores = [];
      // if (rounds.length > 20) {
        findLowest20Scores(rounds);
      // } else {
        // rounds.forEach(round => lowest20Scores.push(round.score));
      // }
      // console.log('lowest20Scores: ', lowest20Scores);
      user.handicap = 4;
      user.save((err, updatedUser) => {
        if (err) console.log(err);
      })
      // console.log('user.handicap: ', user.handicap);
    })
  });
}

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
      calculateHandicap(user._id);
      res.json({newRound});
    }
  });
});

router.put('/', (req, res) => {
  const { user, roundId, course, teebox, date, score, price, notes } = req.body;
  Round.findById(roundId, (err, round) => {
    round.courseId = course._id;
    round.teeboxId = teebox._id;
    round.date = date;
    round.score = score;
    round.price = price;
    round.notes = notes;
    round.save((err, updatedRound) => {
      calculateHandicap(user._id);
      res.json({updatedRound});
    });
  });
});

router.delete('/', (req, res) => {
  Round.findByIdAndRemove(req.body.id, function(err) {
    if (err) {
      console.log(err);
    } else {
      calculateHandicap(req.body.user._id);
      res.send({msg: 'deleted'});
    }
  });
});

module.exports = router;
