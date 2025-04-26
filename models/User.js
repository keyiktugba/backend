//model/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8
  },
  total_points: {
    type: Number,
    default: 0
  },
  games_won: {
    type: Number,
    default: 0
  },
  games_played: {
    type: Number,
    default: 0
  },
  success_rate: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

// Calculate success rate
userSchema.pre('save', function(next) {
  if (this.games_played > 0) {
    this.success_rate = (this.games_won / this.games_played) * 100;
  } else {
    this.success_rate = 0;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
