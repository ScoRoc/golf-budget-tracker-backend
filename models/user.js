var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 99
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minLength: 5,
    maxLength: 99
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    maxLength: 99
  },
  handicap: {
    type: Number
  }
})

userSchema.set('toJSON', {
  transform: function(doc, ret, options) {  // ret stands for return
    let returnJson = {
      _id: ret._id,
      email: ret.email,
      name: ret.name,
      handicap: ret.handicap
    }
    return returnJson
  }
});

userSchema.set('toObject', {
  transform: function(doc, ret, options) {  // ret stands for return
    let returnObject = {...ret};
    delete returnObject.password
    return returnObject
  }
});

userSchema.methods.authenticated = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, res) {
    if (err) {
      cb(err)
    } else {
      cb(null, res ? this : false)
    }
  })
}

userSchema.pre('save', function(next) {
  if (this.isNew) {
    var hash = bcrypt.hashSync(this.password, 10)
    this.password = hash;
  }
  next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;
