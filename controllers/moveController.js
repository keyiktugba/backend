// controllers/moveController.js

// Modelleri ve yardımcı dosyaları dahil ediyoruz
const Move = require('../models/Move');
const Game = require('../models/Game');
const { validWordsSet, letterPoints, bonusTiles } = require('../utils/wordUtils');

// 🎯 Yardımcı Fonksiyonlar

// Yatay (soldan sağa) bir kelimeyi bulur
function extractWordHorizontal(board, x, y) {
    let startX = x;
    while (startX > 0 && board[y][startX - 1]) {
        startX--;
    }
    let word = '';
    let coords = [];
    while (startX < board[0].length && board[y][startX]) {
        word += board[y][startX];
        coords.push({ x: startX, y });
        startX++;
    }
    return { word, coords };
}

// Dikey (yukarıdan aşağıya) bir kelimeyi bulur
function extractWordVertical(board, x, y) {
    let startY = y;
    while (startY > 0 && board[startY - 1][x]) {
        startY--;
    }
    let word = '';
    let coords = [];
    while (startY < board.length && board[startY][x]) {
        word += board[startY][x];
        coords.push({ x, y: startY });
        startY++;
    }
    return { word, coords };
}

// Komşu bir harf var mı kontrol eder (bağlantı zorunluluğu için)
function hasAdjacentTile(board, x, y) {
    const directions = [
        [0, 1],   // sağ
        [1, 0],   // aşağı
        [0, -1],  // sol
        [-1, 0]   // yukarı
    ];
    return directions.some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return board[ny]?.[nx];
    });
}

// Bir kelimenin toplam puanını hesaplar
function calculateWordPoints(wordCoords, board) {
    let points = 0;
    for (const { x, y } of wordCoords) {
        const letter = board[y][x];
        points += letterPoints[letter.toUpperCase()] || 0;
        // Bonus puanlar da buraya eklenebilir (ileride)
    }
    return points;
}

// 🎯 Hamle doğrulama fonksiyonu
function validateMove(board, placedTiles, firstMove = false) {
    const tempBoard = board.map(row => [...row]);

    for (const { x, y, letter } of placedTiles) {
        if (tempBoard[y][x]) {
            throw new Error(`(${x},${y}) zaten dolu.`);
        }
        tempBoard[y][x] = letter;
    }

    let formedWords = new Set();
    let detailedWords = [];
    let hasConnection = false;

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
        if (!hasConnection && hasAdjacentTile(board, x, y)) {
            hasConnection = true;
        }
    }

    if (!firstMove && !hasConnection) {
        throw new Error("Önceki harflerle bağlantı yok.");
    }

    for (const word of formedWords) {
        if (!validWordsSet.has(word)) {
            throw new Error(`Geçersiz kelime bulundu: ${word}`);
        }
    }

    const validWords = detailedWords.map(({ word, coords }) => ({
        word: word.toLowerCase(),
        coords,
        points: calculateWordPoints(coords, tempBoard)
    }));

    const totalPoints = validWords.reduce((sum, w) => sum + w.points, 0);

    return { validWords, totalPoints };
}

// 🎯 Ana Controller Fonksiyonları

module.exports = {
    // Yeni bir hamle kaydeder
    async createMove(req, res) {
        try {
            const { gameId, playerId, placedTiles, boardState, firstMove } = req.body;

            if (!gameId || !playerId || !placedTiles || !boardState) {
                return res.status(400).json({ message: "Eksik veri gönderildi." });
            }

            const { validWords, totalPoints } = validateMove(boardState, placedTiles, firstMove);

            const move = new Move({
                gameId,
                playerId,
                placed: placedTiles,
                validWords,
                totalPoints
            });

            await move.save();

            // Eğer istenirse burada oyunun skor güncellemesi yapılabilir
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
