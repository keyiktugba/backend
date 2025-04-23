// controllers/gameController.js
const Game = require('../models/Game');
const User = require('../models/User');
const Word = require('../models/Word');

// Yeni oyun oluştur
exports.createGame = async (req, res) => {
  try {
    const { userId, oyun_turu } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const game = new Game({
      oyuncular: [{
        kullanici_id: userId,
        kullanici_adi: user.username,
        sira_no: 1,
        sira_bende_mi: true
      }],
      oyun_turu,
      mevcut_sira: userId
    });

    game.harfHavuzuOlustur();
    game.mayinOdulYerlestir();

    await game.save();

    res.status(201).json({
      message: 'Oyun başarıyla oluşturuldu',
      gameId: game._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oyuna katıl
exports.joinGame = async (req, res) => {
  try {
    const { gameId, userId } = req.body;
    
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Oyun bulunamadı' });
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    if (game.oyuncular.length >= 2) {
      return res.status(400).json({ message: 'Oyun dolu' });
    }

    if (game.oyuncular.find(o => o.kullanici_id.toString() === userId)) {
      return res.status(400).json({ message: 'Zaten bu oyundasınız' });
    }

    game.oyuncular.push({
      kullanici_id: userId,
      kullanici_adi: user.kullanici_adi,
      sira_no: 2,
      sira_bende_mi: false
    });

    if (game.oyuncular.length === 2) {
      game.durum = 'aktif';
      game.baslangic_zamani = new Date();
      game.tahta = generateGameBoard();
    }

    await game.save();

    res.json({
      message: 'Oyuna katıldınız',
      gameId: game._id,
      durum: game.durum,
      oyuncular: game.oyuncular,
      tahta: game.tahta
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Oyun bilgisini getir
exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('oyuncular.kullanici_id', 'kullanici_adi')
      .populate('mevcut_sira', 'kullanici_adi')
      .populate('kazanan', 'kullanici_adi');

    if (!game) {
      return res.status(404).json({ message: 'Oyun bulunamadı' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Kelime doğrulama
exports.verifyWord = async (req, res) => {
  try {
    const { gameId, userId, word } = req.body;

    const wordExists = await Word.findOne({ kelime: word.toLowerCase() }); // Modelde 'kelime' alanı varsa

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Oyun bulunamadı' });

    // Sıra kontrolü
    if (game.mevcut_sira.toString() !== userId) {
      return res.status(400).json({ message: 'Şu anda sıra sizde değil' });
    }

    // Oyun aktif mi?
    if (game.durum !== 'aktif') {
      return res.status(400).json({ message: 'Oyun şu an aktif değil' });
    }

    let result = false;
    let points = 0;

    if (wordExists) {
      result = true;
      points = word.length;

      // PUAN DURUMU güncelle
      const mevcutPuan = game.puan_durumu.get(userId) || 0;
      game.puan_durumu.set(userId, mevcutPuan + points);

      // BULUNAN KELİMELER güncelle
      const kelimeler = game.bulunan_kelimeler.get(userId) || [];
      kelimeler.push(word.toLowerCase());
      game.bulunan_kelimeler.set(userId, kelimeler);

      // Sırayı diğer oyuncuya ver
      const otherPlayer = game.oyuncular.find(o => o.kullanici_id.toString() !== userId);
      if (otherPlayer) {
        game.mevcut_sira = otherPlayer.kullanici_id;
      }
    }

    await game.save();

    res.json({
      result,
      points,
      currentScore: game.puan_durumu.get(userId) || 0,
      nextTurn: game.mevcut_sira
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Aktif oyunları listele
exports.getActiveGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'waiting' })
      .populate('players', 'username')
      .limit(10);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yardımcı fonksiyon
function generateGameBoard() {
  const size = 5;
  const board = [];
  const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
  
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      row.push(alphabet[randomIndex]);
    }
    board.push(row);
  }
  
  return board;
}
