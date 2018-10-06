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

const findLowestDifferentials = (rounds, options) => {
  const timeSorted = quickSortRounds(rounds, 'dateTime').reverse();
  const recentRounds = [];
  for (let i = 0; i < options.sampleSize; i++) {
    recentRounds.push(timeSorted[i]);
  }
  console.log('recentRounds.length: ', recentRounds.length);
  const sortedRounds = quickSortRounds(recentRounds, 'handicapDifferential');
  const lowestDifferentials = [];
  for (let i = 0; i < options.roundsToUse; i++) {
    lowestDifferentials.push(sortedRounds[i]);
  }
  console.log('lowestDifferentials: ', lowestDifferentials);
  return lowestDifferentials;
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
    console.log('in 20+');
    handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: 20, roundsToUse: 10})
      .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
  } else {
    switch (rounds.length) {
      case 19:
      console.log('in 19');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 9})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 18:
      console.log('in 18');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 8})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 17:
      console.log('in 17');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 7})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 16:
      case 15:
      console.log('in 15, 16');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 6})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 14:
      case 13:
      console.log('in 13, 14');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 5})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 12:
      case 11:
      case 10:
      console.log('in 10, 11, 12');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 4})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 9:
      case 8:
      case 7:
      console.log('in 7, 8, 9');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 3})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 6:
      case 5:
      case 4:
      console.log('in 4, 5, 6');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 2})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
        break;
      case 3:
      case 2:
      case 1:
      console.log('in 1, 2, 3');
        handicap = Math.floor(findLowestDifferentials(rounds, {sampleSize: rounds.length, roundsToUse: 1})
          .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / 10);
          console.log('handicap: ', handicap);
        break;
    }
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
