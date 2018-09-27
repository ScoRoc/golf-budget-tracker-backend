require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var Course = require('../models/course');

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

router.post('/login', (req, res, next) => {
  let hashedPass = '';
  let passwordMatch = false;
  let email = req.body.email.toLowerCase();

  // Look up the User
  User.findOne({ email }, function(err, user) {
    hashedPass = user.password
    // Compare hashedPass to submitted password
    passwordMatch = bcrypt.compareSync(req.body.password, hashedPass)
    if (passwordMatch) {
      // The passwords match...
      var token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
        expiresIn: 60 * 60 * 24 // expires in 24 hours
      })
      res.json({user, token})
    } else {
      console.log("Passwords don't match")
      res.status(401).json({
        error: true,
        message: 'Email or password is incorrect'
      })
    }
  })
})

router.post('/signup', (req, res, next) => {
  let email = req.body.email.toLowerCase();
  User.findOne({ email }, function(err, user) {
    if (user) {
      res.redirect('/auth/signup')
    } else {
      User.create({
        name: req.body.name,
        email,
        password: req.body.password
      }, function(err, user) {
        if (err) {
          console.log("GOT AN ERROR CREATING THE USER")
          console.log(err)
          res.send(err)
        } else {
          console.log("JUST ABOUT TO SIGN THE TOKEN")
          var token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
            expiresIn: 60 * 60 * 24
          })
          console.log("user: ", user)
          console.log("token: ", token)
          res.json({user, token})
        }
      })
    }
  })
})



module.exports = router;
