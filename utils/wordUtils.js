// utils/wordUtils.js

// 1. Türkçe kelime listesi (JSON dosyasından)
//    JSON dosyanızın proje içinde '../assets/kelimeler.json' yolunda olduğundan emin olun.
const kelimeListesi = require('../assets/kelimeler.json');

// 2. Harf puan tablosu (Scrabble benzeri puanlar)
const letterPoints = {
  A: 1,  B: 3,  C: 4,  Ç: 4,  D: 3,
  E: 1,  F: 7,  G: 5,  Ğ: 8,  H: 5,
  I: 2,  İ: 1,  J:10,  K: 1,  L: 1,
  M: 2,  N: 1,  O: 2,  Ö: 7,  P: 5,
  R: 1,  S: 2,  Ş: 4,  T: 1,  U: 2,
  Ü: 3,  V: 7,  Y: 3,  Z: 4,  Joker: 0
};

// 3. Bonus taşları
const bonusTiles = {
  K3: [{ row: 0, col: 0 }, { row: 0, col: 14 }, { row: 14, col: 0 }, { row: 14, col: 14 }],
  H3: [
    { row: 1, col: 5 }, { row: 1, col: 9 }, { row: 5, col: 1 }, { row: 5, col: 13 },
    { row: 9, col: 1 }, { row: 9, col: 13 }, { row: 13, col: 5 }, { row: 13, col: 9 }
  ],
  K2: [
    { row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 }, { row: 4, col: 4 },
    { row: 10, col: 10 }, { row: 11, col: 11 }, { row: 12, col: 12 }, { row: 13, col: 13 },
    { row: 1, col: 13 }, { row: 2, col: 12 }, { row: 3, col: 11 }, { row: 4, col: 10 },
    { row: 10, col: 4 }, { row: 11, col: 3 }, { row: 12, col: 2 }, { row: 13, col: 1 }
  ],
  H2: [
    { row: 0, col: 3 }, { row: 0, col: 11 }, { row: 2, col: 6 }, { row: 2, col: 8 },
    { row: 3, col: 0 }, { row: 3, col: 7 }, { row: 3, col: 14 }, { row: 6, col: 2 },
    { row: 6, col: 6 }, { row: 6, col: 8 }, { row: 6, col: 12 }, { row: 7, col: 3 },
    { row: 7, col: 11 }, { row: 8, col: 2 }, { row: 8, col: 6 }, { row: 8, col: 8 },
    { row: 8, col: 12 }, { row: 11, col: 0 }, { row: 11, col: 7 }, { row: 11, col: 14 },
    { row: 12, col: 6 }, { row: 12, col: 8 }, { row: 14, col: 3 }, { row: 14, col: 11 }
  ],
  CENTER: [{ row: 7, col: 7 }]
};

// 4. Sözlük kontrolü
//    Verilen kelimeyi (string) sözlükte arar. Büyük/küçük harf duyarsız.
//    true dönerse kelime geçerli.
function validateWord(word) {
  if (typeof word !== 'string') return false;
  return kelimeListesi.includes(word.toLowerCase());
}

// 5. Harf bazlı puan döndürme
//    Örneğin 'A' için 1, 'J' için 10 puan döner.
function letterScore(letter) {
  if (typeof letter !== 'string' || letter.length !== 1) return 0;
  return letterPoints[letter.toUpperCase()] || 0;
}

// 6. Bir kelimenin toplam puanını hesaplama
//    word: string, pozisyon bilgisi gerekmez; sadece harf puanlarını toplar.
function calculateWordScore(word) {
  if (typeof word !== 'string') return 0;
  return word
    .split('')
    .reduce((sum, ch) => sum + letterScore(ch), 0);
}

// 7. Belirli bir bonus tipine göre harf puanına çarpan uygulama
//    bonusType: 'H2' | 'H3' | 'K2' | 'K3' | null
//    puan: Number
//    dönen: bonus uygulanmış puan
function applyBonus(puan, bonusType) {
  switch (bonusType) {
    case 'H2': return puan * 2;
    case 'H3': return puan * 3;
    case 'K2': return puan; // kelime bonusu, harf puanına etki etmez
    case 'K3': return puan;
    default:   return puan;
  }
}

// 8. Kelime bonusunu (K2/K3) toplam skora uygulama
//    toplamPuan: Number, wordMultiplier: Number
//    return toplamPuan * wordMultiplier
function applyWordMultiplier(totalPuan, wordMultiplier) {
  return totalPuan * (wordMultiplier || 1);
}

// 9. Bonus taşları üzerinde işlem yaparak bonus hesaplamalarını yapma
//    Pozisyon: { row: Number, col: Number }
//    bonusType: 'K2' | 'K3' | 'H2' | 'H3' | 'CENTER'
//    dönen: bonus türüne göre puan
function getTileBonus(row, col) {
  for (const bonusType in bonusTiles) {
    for (const { row: br, col: bc } of bonusTiles[bonusType]) {
      if (br === row && bc === col) {
        return bonusType;
      }
    }
  }
  return null;  // Bonus taşı değilse
}

module.exports = {
  validateWord,
  letterScore,
  calculateWordScore,
  applyBonus,
  applyWordMultiplier,
  getTileBonus
};
