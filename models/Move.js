const mongoose = require('mongoose');

const placedTileSchema = new mongoose.Schema({
  x:      { type: Number, required: true },
  y:      { type: Number, required: true },
  letter: { type: String, required: true }
}, { _id: false });

const validWordSchema = new mongoose.Schema({
  word:   { type: String, required: true },
  coords: [{ 
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }],
  points: { type: Number, required: true }
}, { _id: false });

const moveSchema = new mongoose.Schema({
  gameId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Game',   required: true },
  playerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  placed:      { type: [placedTileSchema],        required: true }, // Bu hamlede yerleştirilen harfler
  validWords:  { type: [validWordSchema],         default: [] },      // Oluşan ve sözlükte geçerli bulunan kelimeler
  totalPoints: { type: Number,                    required: true },   // Bu hamleden gelen toplam puan
  createdAt:   { type: Date,    default: Date.now }
});

module.exports = mongoose.model('Move', moveSchema);
