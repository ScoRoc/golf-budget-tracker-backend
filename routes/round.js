require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Teebox = require('../models/teebox');
var Round = require('../models/round');

const quickSortRounds = rounds => {
  const lesser = [];
  const equal = [];
  const greater = [];
  if (rounds.length < 2) {
    return rounds;
  }
  rounds.forEach(round =>{
    let pivot = rounds[0].score;
    if (round.score < pivot) {
      lesser.push(round);
    } else if (round.score === pivot) {
      equal.push(round);
    } else if (round.score > pivot) {
      greater.push(round);
    }
  });
  return [...quickSortRounds(lesser),...equal,...quickSortRounds(greater)];
};

const findLowest10Scores = rounds => {
  const sortedRounds = quickSortRounds(rounds);
  const lowest10Scores = [];
  for (let i = 0; i < 10; i++) {
    lowest10Scores.push(sortedRounds[i]);
  }
  return lowest10Scores;
};

async function calculateHandicap(userId) {
  let user = await User.findById(userId).lean( (err, user) => user );
  let rounds = await Round.find({userId: user._id}).lean( (err, rounds) => rounds );
  let bur = new Date(rounds[0].date);
  console.log('bur: ', bur);
  await Promise.all(rounds.map(async round => {
    const teebox = await Teebox.findById(round.teeboxId).lean( (err, teebox) => teebox );
    round.rating = teebox.rating;
    round.slope = teebox.slope;
    return round;
  }));

  // if (rounds.length >= 20) {
    let foo = findLowest10Scores(rounds);
    // console.log('foo: ', foo);

  // } else {
    // doo stuffffff
  // }


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
