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

// Kullanıcı kaydı
// Kullanıcı kaydı
exports.registerUser = async (req, res) => {
    try {
      const { kullanici_adi, email, sifre } = req.body;
  
      // E-posta zaten var mı kontrol et
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
      }
  
      // Yeni kullanıcı oluştur
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
  };  

// Kullanıcı girişi
// Kullanıcı girişi
exports.loginUser = async (req, res) => {
    try {
      const { email, sifre } = req.body;
  
      // E-posta ile kullanıcıyı bul
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Geçersiz email veya şifre' });
      }
  
      // Şifreyi kontrol et
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
  };
  

// Kullanıcı profilini getir
// Kullanıcı profilini getir
exports.getUserProfile = async (req, res) => {
    try {
      const userId = req.query.id;
      const user = await User.findById(userId);
      
      if (user) {
        res.json({
          _id: user._id,
          username: user.kullanici_adi,
          email: user.email,
          points: user.genel_puan,
          gamesPlayed: user.toplam_oyun,
          gamesWon: user.kazanilan_oyun
        });
      } else {
        res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
// En yüksek puanlı kullanıcıları getir
exports.getLeaderboard = async (req, res) => {
    try {
      const users = await User.find().sort({ genel_puan: -1 }).limit(10).select('kullanici_adi genel_puan toplam_oyun kazanilan_oyun');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  