'use strict';
// dependencies setup
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = mongoose.Schema({
  fullName: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  resetToken: {
    type: String,
    default: null
  },
  resetExpires: {
    type: Number,
    default: null
  },
  createDate: {
    type: Date,
    default: Date.now
  },
  modifiedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});

// initialize model object
module.exports = mongoose.model('User', UserSchema);

// encrypt raw password
module.exports.encryptPassword = function (rawText) {
  return new Promise((resolve, reject) => {
    // resolve hash as null
    if (!rawText || typeof rawText == 'undefined')
      resolve(null);
    else {
      // initialize salt to generate hash
      bcrypt.genSalt(10, (err, salt) => {
        // reject if error
        if (err)
          reject(err);
        else {
          // generate hash text
          bcrypt.hash(rawText, salt, (err, hash) => {
            // reject if error
            if (err)
              reject(err);
            // resolve hash value
            else
              resolve(hash);
          });
        }
      });
    }
  });
}

// match password with existing password
module.exports.comparePassword = function (candidatePassword, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err)
        reject(err);
      else
        resolve(isMatch);
    });
  });
}