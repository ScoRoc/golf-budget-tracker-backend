require('dotenv').config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var bcrypt = require('bcrypt');

var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');

router.post('/login', (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    let err = {
      msg: 'Incorrect email and/or password.'
    };
    console.log(Error(err.msg));
    res.send({err});
    return;
  }
  let hashedPass = '';
  let passwordMatch = false;
  let email = req.body.email.toLowerCase();
  // Look up the User
  User.findOne({ email }, function(err, user) {
    if (user) hashedPass = user.password;
    // Compare hashedPass to submitted password
    passwordMatch = bcrypt.compareSync(req.body.password, hashedPass)
    if (passwordMatch) {
      // The passwords match...
      var token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
        expiresIn: 60 * 60 * 24 * 7 // expires in 7 days (60 sec * 60 min * 24 hrs * 7 days)
      })
      res.json({user, token})
    } else {
      console.log("Email or password is incorrect");
      res.send({
        err: {
          msg: 'Incorrect email and/or password.'
        }
      })
    }
  })
})

router.post('/signup', (req, res, next) => {
  if (!req.body.email || !req.body.password || !req.body.name) {
    let err = {
      msg: 'Please enter your full name, email, and password'
    };
    console.log(Error(err.msg));
    res.send({err});
    return;
  }
  let email = req.body.email.toLowerCase();
  User.findOne({ email }, function(err, user) {
    if (user) {
      res.redirect('/auth/signup')
    } else {
      User.create({
        name: req.body.name,
        email,
        password: req.body.password,
        handicap: 99,
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

router.post('/me/from/token', (req, res, next) => {
  // Check for presence of a token
  var token = req.body.token
  if (!token) {
    res.status(401).json({message: "Must pass the token"})
  } else {
    jwt.verify(token, process.env.JWT_SECRET, function(err, user) {
      if (err) {
        res.status(401).send(err)
      } else {
        // TODO: Why does the "_id" need to be in quotes?
        User.findById({
          '_id': user._id
        }, function(err, user) {
          if (err) {
            res.status(401).send(err)
          } else {
            res.json({user, token})
          }
        })
      }
    })
  }
})

module.exports = router;
