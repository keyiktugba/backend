//Game.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSchema = new Schema({
  // Oyuna katılmış oyuncular (1 veya 2 kişi)
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Oyun süresi/ türü: 2dk, 5dk, 12saat, 24saat
  type: {
    type: String,
    enum: ['2dk', '5dk', '12saat', '24saat'],
    required: true
  },
  // Oyun oluşturulduğu veya başladığı zaman
  startedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Oyun bittiğinde set edilecek bitiş zamanı
  endedAt: {
    type: Date,
    default: null
  },
  // Oyunun aktif (başlamış ve iki oyunculu) olup olmadığı
  isActive: {
    type: Boolean,
    default: false
  },
  // Sıra hangi oyuncuda
  currentTurn: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);
