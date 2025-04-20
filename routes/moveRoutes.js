const express = require('express');
const router = express.Router();
const Move = require('../models/Move');
const Game = require('../models/Game');
const User = require('../models/User');

// @desc    Hamle yap
// @route   POST /api/moves
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      oyun_id,
      kullanici_id,
      kullanici_adi,
      kelime,
      koordinatlar,
      puan,
      sira_no,
      hamle_turu,
      mayin,
      odul_kazanildi,
      odul_kullanildi
    } = req.body;

    // Gerekli alanların kontrolü
    if (!oyun_id || !kullanici_id || !sira_no) {
      return res.status(400).json({ message: 'Oyun ID, kullanıcı ID ve sıra numarası zorunludur' });
    }

    // Oyun ve kullanıcı varlığını kontrol et
    const game = await Game.findById(oyun_id);
    const user = await User.findById(kullanici_id);

    if (!game) {
      return res.status(404).json({ message: 'Oyun bulunamadı' });
    }

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Hamle oluştur
    const newMove = await Move.create({
      oyun_id,
      kullanici_id,
      kullanici_adi: kullanici_adi || user.username,
      kelime,
      koordinatlar,
      puan: puan || (kelime ? kelime.length : 0), // Basit puan hesaplama
      sira_no,
      hamle_turu,
      mayin: mayin || { tetiklendi_mi: false },
      odul_kazanildi: odul_kazanildi || { kazanildi_mi: false },
      odul_kullanildi: odul_kullanildi || { kullanildi_mi: false }
    });

    res.status(201).json(newMove);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Bir oyuna ait tüm hamleleri getir
// @route   GET /api/moves/game/:oyunId
// @access  Private
router.get('/game/:oyunId', async (req, res) => {
  try {
    const oyunId = req.params.oyunId;
    
    const moves = await Move.find({ oyun_id: oyunId })
      .sort({ sira_no: 1 }) // Sıra numarasına göre artan sıralama
      .populate('kullanici_id', 'username'); // Kullanıcı bilgilerini ekle
    
    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Bir oyuncunun bir oyundaki tüm hamlelerini getir
// @route   GET /api/moves/player/:oyunId/:kullaniciId
// @access  Private
router.get('/player/:oyunId/:kullaniciId', async (req, res) => {
  try {
    const { oyunId, kullaniciId } = req.params;
    
    const moves = await Move.find({ 
      oyun_id: oyunId,
      kullanici_id: kullaniciId 
    }).sort({ sira_no: 1 });
    
    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Belirli bir hamleyi getir
// @route   GET /api/moves/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const move = await Move.findById(req.params.id)
      .populate('kullanici_id', 'username')
      .populate('oyun_id');
    
    if (!move) {
      return res.status(404).json({ message: 'Hamle bulunamadı' });
    }
    
    res.json(move);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Bir hamleyi güncelle (ödül kullanımı veya mayın etkisi için)
// @route   PUT /api/moves/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      puan,
      mayin,
      odul_kazanildi,
      odul_kullanildi
    } = req.body;
    
    const move = await Move.findById(req.params.id);
    
    if (!move) {
      return res.status(404).json({ message: 'Hamle bulunamadı' });
    }
    
    // Güncellenecek alanlar
    if (puan !== undefined) move.puan = puan;
    if (mayin) move.mayin = { ...move.mayin, ...mayin };
    if (odul_kazanildi) move.odul_kazanildi = { ...move.odul_kazanildi, ...odul_kazanildi };
    if (odul_kullanildi) move.odul_kullanildi = { ...move.odul_kullanildi, ...odul_kullanildi };
    
    const updatedMove = await move.save();
    
    res.json(updatedMove);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Tüm mayın tetiklenme hamlelerini getir (istatistik için)
// @route   GET /api/moves/mines
// @access  Private
router.get('/mines/triggered', async (req, res) => {
  try {
    const mineMoves = await Move.find({ 
      'mayin.tetiklendi_mi': true 
    }).populate('kullanici_id', 'username')
      .populate('oyun_id')
      .sort({ hamle_zamani: -1 });
    
    res.json(mineMoves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Tüm ödül kazanma hamlelerini getir (istatistik için)
// @route   GET /api/moves/rewards
// @access  Private
router.get('/rewards/earned', async (req, res) => {
  try {
    const rewardMoves = await Move.find({ 
      'odul_kazanildi.kazanildi_mi': true 
    }).populate('kullanici_id', 'username')
      .populate('oyun_id')
      .sort({ hamle_zamani: -1 });
    
    res.json(rewardMoves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Belirli bir kelimenin kaç kez oynandığını getir (istatistik için)
// @route   GET /api/moves/words/stats
// @access  Private
router.get('/words/stats', async (req, res) => {
  try {
    const wordStats = await Move.aggregate([
      { $match: { kelime: { $ne: null, $ne: '' } } },
      { $group: { 
        _id: '$kelime', 
        count: { $sum: 1 },
        totalPoints: { $sum: '$puan' },
        firstUsed: { $min: '$hamle_zamani' },
        lastUsed: { $max: '$hamle_zamani' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    res.json(wordStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Bir oyundaki son hamleyi getir
// @route   GET /api/moves/game/:oyunId/last
// @access  Private
router.get('/game/:oyunId/last', async (req, res) => {
  try {
    const oyunId = req.params.oyunId;
    
    const lastMove = await Move.findOne({ oyun_id: oyunId })
      .sort({ sira_no: -1 }) // Son hamleyi bul
      .populate('kullanici_id', 'username');
    
    if (!lastMove) {
      return res.json(null); // Henüz hamle yapılmamış
    }
    
    res.json(lastMove);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Bir hamleyi sil (test veya hatalı kayıt düzeltme için)
// @route   DELETE /api/moves/:id
// @access  Admin
router.delete('/:id', async (req, res) => {
  try {
    const move = await Move.findById(req.params.id);
    
    if (!move) {
      return res.status(404).json({ message: 'Hamle bulunamadı' });
    }
    
    await move.deleteOne();
    
    res.json({ message: 'Hamle silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;