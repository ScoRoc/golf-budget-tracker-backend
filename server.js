require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');

// Mongoose stuff
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/golf-budget-tracker-backend');  // change db name here

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'client', 'build')));

// Do we still need this?
app.use(function(req, res, next) {
  // before every route, attach the flash messages and current user to res.locals
  res.locals.currentUser = req.user;
  next();
});

// app.get('/api', function(req, res) {
//   console.log('hi from the back');
//   res.send('this is in server.js on backend');
// });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/course', require('./routes/course'));
app.use('/api/round', require('./routes/round'));
app.use('/api/teebox', require('./routes/teebox'));
app.use('/api/user', require('./routes/user'));

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

module.exports = app;
