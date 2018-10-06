require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Teebox = require('../models/teebox');
var Round = require('../models/round');

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

const findLowest10Differentials = rounds => {
  const timeSorted = quickSortRounds(rounds, 'dateTime').reverse();
  const recent20rounds = [];
  for (let i = 0; i < 20; i++) {
    recent20rounds.push(timeSorted[i]);
  }
  const sortedRounds = quickSortRounds(recent20rounds, 'handicapDifferential');
  const lowest10Differentials = [];
  for (let i = 0; i < 10; i++) {
    lowest10Differentials.push(sortedRounds[i]);
  }
  return lowest10Differentials;
};

const calculateHandicap = async (userId) => {
  let user = await User.findById(userId).lean( (err, user) => user );
  let rounds = await Round.find({userId: user._id}).lean( (err, rounds) => rounds );
  await Promise.all(rounds.map(async round => {
    let roundDate = new Date(round.date);
    const teebox = await Teebox.findById(round.teeboxId).lean( (err, teebox) => teebox );
    round.rating = teebox.rating;
    round.slope = teebox.slope;
    round.dateTime = roundDate.getTime();
    return round;
  }));
  let handicap = null;
  if (rounds.length >= 20) {
    let lowest10rounds = findLowest10Differentials(rounds);
    handicap = Math.floor(lowest10rounds.map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
  } else {
    // doo stuffffff
  }
  User.findById(userId, (err, user) => {
    user.handicap = handicap;
    user.save();
  });
};

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
  Teebox.findById(teebox._id).lean().exec((err, oneTeebox) => {
    let { rating, slope } = oneTeebox;
    let handicapDifferential = parseFloat( ((score - rating) * 113 / slope).toFixed(1) );
    Round.create({
      courseId: course._id,
      teeboxId: teebox._id,
      date,
      score,
      price,
      notes,
      handicapDifferential,
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
