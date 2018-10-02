require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Course = require('../models/course');
var Teebox = require('../models/teebox');

// router.get('/:id', (req, res) => {
//   Course.find({userId: req.params.id}, function(err, courses) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.json({courses});
//     }
//   })
// });

router.post('/', (req, res) => {
  const { name, rating, slope, courseId } = req.body;
  Teebox.create({
    name,
    rating,
    slope,
    courseId
  }, function(err, newTeebox) {
    if (err) {
      console.log(err)
      res.send(err)
    } else {
      // console.log('newTeebox: ', newTeebox);
      res.json({newTeebox});
    }
  });
});

router.put('/', (req, res) => {
  const { name, rating, slope, id } = req.body;
  Teebox.findById(id, (err, teebox) => {
    teebox.name = name;
    teebox.rating = rating;
    teebox.slope = slope;
    teebox.save((err, updatedTeebox) => {
      res.json({updatedTeebox});
    });
  });
});

router.delete('/', (req, res) => {
  Teebox.findByIdAndRemove(req.body.id, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.send({msg: 'deleted'});
    }
  })
});

module.exports = router;
