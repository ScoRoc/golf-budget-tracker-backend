require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');

// Mongoose stuff
var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/golf-budget-tracker-backend');  // for local deployment
mongoose.connect(process.env.MONGO_ATLAS_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
}); // for heroku NEW using Mongo Atlas

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/course', require('./routes/course'));
app.use('/api/round', require('./routes/round'));
app.use('/api/teebox', require('./routes/teebox'));
app.use('/api/user', require('./routes/user'));

app.use(express.static(path.join(__dirname, '/client/public')));

app.get('/support', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

// IN PACKAGE JSON, CHANGE LINE 8 START SCRIPT TO NODEMON WHEN DEPLOYING LOCALLY

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

module.exports = app;
