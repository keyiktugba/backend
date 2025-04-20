const mongoose = require('mongoose');

const mineTypeSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true },
  aciklama: String,
  varsayilan_adet: { type: Number, required: true }
});

const MineType = mongoose.model('MineType', mineTypeSchema);
module.exports = MineType;
