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
  const { sampleSize, roundsToUse } = options;
  const timeSorted = quickSortRounds(rounds, 'dateTime').reverse();
  const recentRounds = [];
  for (let i = 0; i < sampleSize; i++) {
    recentRounds.push(timeSorted[i]);
  }
  const sortedRounds = quickSortRounds(recentRounds, 'handicapDifferential');
  const lowestDifferentials = [];
  for (let i = 0; i < roundsToUse; i++) {
    lowestDifferentials.push(sortedRounds[i]);
  }
  return lowestDifferentials;
};

const averageDifferential = (roundArray, options) => {
  const { sampleSize, roundsToUse } = options;
  return findLowestDifferentials(roundArray, {sampleSize, roundsToUse})
    .map(round => round.handicapDifferential).reduce((acc, cur) => acc + cur) / roundsToUse;
}

const calculateHandicap = async (userId) => {
  let user = await User.findById(userId).lean( (err, user) => user );
  let allRounds = await Round.find({userId: user._id}).lean( (err, rounds) => rounds);
  let rounds = allRounds.filter(round => !round.teamScore);
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
    handicap = averageDifferential(rounds, {sampleSize: 20, roundsToUse: 10});
  } else {
    switch (rounds.length) {
      case 19:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 9});
        break;
      case 18:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 8});
        break;
      case 17:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 7});
        break;
      case 16:
      case 15:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 6});
        break;
      case 14:
      case 13:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 5});
        break;
      case 12:
      case 11:
      case 10:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 4});
        break;
      case 9:
      case 8:
      case 7:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 3});
        break;
      case 6:
      case 5:
      case 4:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 2});
        break;
      case 3:
      case 2:
      case 1:
        handicap = averageDifferential(rounds, {sampleSize: rounds.length, roundsToUse: 1});
        break;
    }
  }
  let newHandicap = parseFloat( (handicap * 0.96).toFixed(1) );
  User.findById(userId, (err, user) => {
    user.handicap = newHandicap;
    user.save();
  });
  return newHandicap;
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

router.post('/', async (req, res) => {
  const { course, teebox, date, score, teamScore, price, notes, user } = req.body;
  if (score === null) throw new Error('The score cannot be emtpy');
  // const foundTeebox = await Teebox.findById(teebox._id);
  // const usersTeeboxes = await Teebox.find({userId: user._id});
  const [ foundTeebox, usersTeeboxes ] = await Promise.all([ Teebox.findById(teebox._id), Teebox.find({userId: user._id}) ]);
  let { rating, slope } = foundTeebox;
  let handicapDifferential = parseFloat( ((score - rating) * 113 / slope).toFixed(1) );
  Round.create({
    courseId: course._id,
    teeboxId: teebox._id,
    date,
    score,
    teamScore,
    price,
    notes,
    handicapDifferential,
    userId: user._id
  }, async (err, newRound) => {
    if (err) {
      console.log("GOT AN ERROR CREATING THE COURSE")
      console.log(err)
      res.send(err)
    } else {
      const handicapIndex = await calculateHandicap(user._id);
      // foundTeebox.teeboxHandicap = Math.round(handicapIndex * slope / 113);
      // foundTeebox.save();
      usersTeeboxes.forEach(teebox => {
        teebox.teeboxHandicap = Math.round(handicapIndex * teebox.slope / 113);
        teebox.save();
      });
      res.json({newRound});
    }
  });
});

router.put('/', async (req, res) => {
  const { user, roundId, course, teebox, date, score, teamScore, price, notes } = req.body;
  const foundTeebox = await Teebox.findById(teebox._id);
  let { rating, slope } = foundTeebox;
  let handicapDifferential = parseFloat( ((score - rating) * 113 / slope).toFixed(1) );
  Round.findOneAndUpdate({_id: roundId}, {$set:{
    courseId: course._id,
    teeboxId: teebox._id,
    date: date,
    score: score,
    teamScore: teamScore,
    price: price,
    notes: notes,
    handicapDifferential: handicapDifferential
  }}, {new: true}, async (err, updatedRound) => {
    const [ foundTeebox, handicapIndex ] = await Promise.all([ Teebox.findById(teebox._id), calculateHandicap(user._id) ]);
    foundTeebox.teeboxHandicap = Math.round(handicapIndex * foundTeebox.slope / 113);
    foundTeebox.save();
    res.json({updatedRound});
  });
});

router.delete('/', (req, res) => {
  Round.findByIdAndRemove(req.body.roundId, async function(err) {
    if (err) {
      console.log(err);
    } else {
      // const foundTeebox = await Teebox.findById(req.body.teeboxId);
      // const handicapIndex = await calculateHandicap(req.body.user._id);
      const [ foundTeebox, handicapIndex ] = await Promise.all([ Teebox.findById(req.body.teeboxId), calculateHandicap(req.body.user._id) ]);
      foundTeebox.teeboxHandicap = Math.round(handicapIndex * foundTeebox.slope / 113);
      foundTeebox.save();
      res.send({msg: 'deleted'});
    }
  });
});

module.exports = router;
