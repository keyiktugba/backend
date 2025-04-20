const mongoose = require('mongoose');

const rewardTypeSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true },
  aciklama: String,
  varsayilan_adet: { type: Number, required: true }
});

const RewardType = mongoose.model('RewardType', rewardTypeSchema);
module.exports = RewardType;
