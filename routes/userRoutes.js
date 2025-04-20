// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getLeaderboard } = require('../controllers/userController');

// Kullanıcı kayıt
router.post('/register', registerUser);

// Kullanıcı girişi
router.post('/login', loginUser);

// Kullanıcı profilini getir
router.get('/profile', getUserProfile);

// En yüksek puanlı kullanıcıları getir
router.get('/leaderboard', getLeaderboard);

module.exports = router;
