//controllers/userController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');

// JWT token oluşturma fonksiyonu
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gizlianahtar', {
    expiresIn: '30d'
  });
};

// User registration
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the email is already in use
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'This email address is already in use' });
    }

    // Create a new user
    const newUser = await User.create({
      username,
      email,
      password_hash: password
    });

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      total_points: newUser.total_points,
      token: generateToken(newUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check the password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      total_points: user.total_points,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.query.id;
    const user = await User.findById(userId);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        total_points: user.total_points,
        games_played: user.games_played,
        games_won: user.games_won,
        success_rate: user.success_rate
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leaderboard (top users by points)
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ total_points: -1 }).limit(10)
      .select('username total_points games_played games_won');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};