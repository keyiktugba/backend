const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT token oluşturma fonksiyonu
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gizlianahtar', {
    expiresIn: '30d'
  });
};

// @desc    Kullanıcı kayıt
// @route   POST /api/users/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kullanıcı kontrolü
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }

    // Kullanıcı oluşturma
    const user = await User.create({
      username,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı verisi' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Kullanıcı girişi
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email kontrolü
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    // Şifre kontrolü
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      points: user.points,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Kullanıcı profilini getir
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    // Burada normalde authentication middleware kullanılır
    // Basitlik için direkt ID ile arama yapıyoruz
    const userId = req.query.id;
    const user = await User.findById(userId);
    
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      });
    } else {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    En yüksek puanlı kullanıcıları getir
// @route   GET /api/users/leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(10).select('username points gamesPlayed gamesWon');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;