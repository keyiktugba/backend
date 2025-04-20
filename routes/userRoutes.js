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
    const { kullanici_adi, email, sifre } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }

    const yeniKullanici = await User.create({
      kullanici_adi,
      email,
      sifre_hash: sifre
    });

    res.status(201).json({
      _id: yeniKullanici._id,
      kullanici_adi: yeniKullanici.kullanici_adi,
      email: yeniKullanici.email,
      genel_puan: yeniKullanici.genel_puan,
      token: generateToken(yeniKullanici._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @desc    Kullanıcı girişi
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, sifre } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    const isMatch = await user.matchPassword(sifre);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    res.json({
      _id: user._id,
      kullanici_adi: user.kullanici_adi,
      email: user.email,
      genel_puan: user.genel_puan,
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