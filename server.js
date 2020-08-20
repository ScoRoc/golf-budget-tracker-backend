require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');

// Mongoose stuff
var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/golf-budget-tracker-backend');  // for local deployment
// mongoose.connect(process.env.MONGODB_URI);  // for heroku OLD using mLab
// mongoose.connect(process.env.MONGO_ATLAS_URI, {
//   useNewUrlParser: true,
//   useCreateIndex: true,
// }); // for heroku NEW using Mongo ATlas
const MongoClient = require('mongodb').MongoClient;
const uri =
  'mongodb+srv://heroku_nxw7hcq0:<password>@my-golf-tracker-prod-01.w059u.mongodb.net/<dbname>?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db('test').collection('devices');
  // perform actions on the collection object
  client.close();
});

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
