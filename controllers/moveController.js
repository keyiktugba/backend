// controllers/moveController.js

// Modelleri ve yardımcı dosyaları dahil ediyoruz
const Move = require('../models/Move');
const Game = require('../models/Game');
const { validWordsSet, letterPoints, bonusTiles } = require('../utils/wordUtils');

// 🎯 Yardımcı Fonksiyonlar

// Yatay (soldan sağa) bir kelimeyi bulur
function extractWordHorizontal(board, x, y) {
    let startX = x;
    // Harfin soluna doğru giderek kelimenin başlangıcını bul
    while (startX > 0 && board[y][startX - 1]) {
        startX--;
    }
    let word = '';
    let coords = [];
    // Başlangıçtan itibaren sağa doğru kelimeyi oluştur
    while (startX < board[0].length && board[y][startX]) {
        word += board[y][startX];
        coords.push({ x: startX, y: y });
        startX++;
    }
    return { word, coords };
}

// Dikey (yukarıdan aşağıya) bir kelimeyi bulur
function extractWordVertical(board, x, y) {
    let startY = y;
    // Harfin yukarısına doğru giderek kelimenin başlangıcını bul
    while (startY > 0 && board[startY - 1][x]) {
        startY--;
    }
    let word = '';
    let coords = [];
    // Başlangıçtan itibaren aşağıya doğru kelimeyi oluştur
    while (startY < board.length && board[startY][x]) {
        word += board[startY][x];
        coords.push({ x: x, y: startY });
        startY++;
    }
    return { word, coords };
}

// Koyulan harflerin komşu bir taşı var mı kontrol eder (bağlantı zorunluluğu için)
function hasAdjacentTile(board, x, y) {
    const dirs = [
        [0, 1],  // sağ
        [1, 0],  // aşağı
        [0, -1], // sol
        [-1, 0]  // yukarı
    ];
    return dirs.some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return board[ny] && board[ny][nx]; // Komşu dolu mu?
    });
}

// Verilen kelimeye karşılık gelen toplam puanı hesaplar
function calculateWordPoints(wordCoords, board) {
    let points = 0;
    for (const { x, y } of wordCoords) {
        const letter = board[y][x];
        points += letterPoints[letter.toUpperCase()] || 0; // Harf puanını topla
        // Eğer istersek bonus tile puanları da buraya eklenebilir
    }
    return points;
}

// 🎯 Ana hamle doğrulama fonksiyonu
function validateMove(board, placedTiles, firstMove = false) {
    // Geçici bir board kopyası oluştur
    const tempBoard = board.map(row => [...row]);

    // Yeni harfleri geçici tahtaya yerleştir
    for (const { x, y, letter } of placedTiles) {
        if (tempBoard[y][x]) {
            throw new Error("(${x},${y}) zaten dolu."); // Üstüne koyma hatası
        }
        tempBoard[y][x] = letter;
    }

    let formedWords = new Set();      // Bulunan kelimeler
    let detailedWords = [];           // Kelimelerin harf koordinat bilgileri
    let hasConnection = false;         // Önceden koyulmuş harfle bağlantı var mı?

    // Tüm yerleştirilen harfler için kelimeleri çıkar
    for (const { x, y } of placedTiles) {
        const horizontal = extractWordHorizontal(tempBoard, x, y);
        if (horizontal.word.length > 1) {
            formedWords.add(horizontal.word.toLowerCase());
            detailedWords.push(horizontal);
        }
        const vertical = extractWordVertical(tempBoard, x, y);
        if (vertical.word.length > 1) {
            formedWords.add(vertical.word.toLowerCase());
            detailedWords.push(vertical);
        }
        // Önceki taşlarla bağlantı olup olmadığını kontrol et
        if (!hasConnection && hasAdjacentTile(board, x, y)) {
            hasConnection = true;
        }
    }

    // Eğer ilk hamle değilse, bağlantı zorunluluğu var
    if (!firstMove && !hasConnection) {
        throw new Error("Önceki harflerle bağlantı yok.");
    }

    // Tüm bulunan kelimelerin geçerli olup olmadığını kontrol et
    for (const word of formedWords) {
        if (!validWordsSet.has(word)) {
            throw new Error("Geçersiz kelime bulundu: ${word}");
        }
    }

    // Geçerli kelimeler ve her birinin puan bilgileri
    const validWords = detailedWords.map(({ word, coords }) => ({
        word: word.toLowerCase(),
        coords,
        points: calculateWordPoints(coords, tempBoard)
    }));

    // Toplam puanı hesapla
    const totalPoints = validWords.reduce((sum, w) => sum + w.points, 0);

    return { validWords, totalPoints };
}

// 🎯 Ana Controller Fonksiyonları

module.exports = {
    // Yeni bir hamle kaydeder
    async createMove(req, res) {
        try {
            const { gameId, playerId, placedTiles, boardState, firstMove } = req.body;

            // Gerekli bilgiler var mı kontrol et
            if (!gameId || !playerId || !placedTiles || !boardState) {
                return res.status(400).json({ message: "Eksik veri gönderildi." });
            }

            // Hamleyi doğrula
            const { validWords, totalPoints } = validateMove(boardState, placedTiles, firstMove);

            // Yeni hamle kaydı oluştur
            const move = new Move({
                gameId,
                playerId,
                placed: placedTiles,
                validWords,
                totalPoints
            });

            await move.save();

            // Eğer istersen burada oyunun toplam skorunu güncelleyebilirsin
            // await Game.findByIdAndUpdate(gameId, { $inc: { totalScore: totalPoints } });

            return res.status(201).json({ message: "Hamle başarıyla kaydedildi.", move });
        } catch (err) {
            console.error(err);
            return res.status(400).json({ message: err.message });
        }
    },

    // Bir oyuna ait tüm hamleleri listeler
    async getMovesByGame(req, res) {
        try {
            const { gameId } = req.params;
            const moves = await Move.find({ gameId }).sort({ createdAt: 1 });
            return res.status(200).json(moves);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Hamleler alınamadı." });
        }
    }
};