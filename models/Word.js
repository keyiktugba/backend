const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  kelime: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  uzunluk: {
    type: Number,
    required: true
  }
});

// Kelimenin uzunluğunu otomatik hesaplama
wordSchema.pre('save', function(next) {
  this.uzunluk = this.kelime.length;
  next();
});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;