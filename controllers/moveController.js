const Move = require('../models/Move');
const Game = require('../models/Game');
const { validWordsSet, letterPointsMap } = require('../utils/wordUtils');
const kelimeListesi = require('../assets/kelimeler.json');



// Yatay kelime çıkarma
function extractWordHorizontal(boardState, x, y) {
    let startX = x;
    while (startX > 0 && boardState[y][startX - 1] !== '') {
        startX--;
    }

    let word = '';
    let currentX = startX;
    while (currentX < boardState[0].length && boardState[y][currentX] !== '') {
        word += boardState[y][currentX];
        currentX++;
    }

    return { word, startX, startY: y };
}

// Dikey kelime çıkarma
function extractWordVertical(boardState, x, y) {
    let startY = y;
    while (startY > 0 && boardState[startY - 1][x] !== '') {
        startY--;
    }

    let word = '';
    let currentY = startY;
    while (currentY < boardState.length && boardState[currentY][x] !== '') {
        word += boardState[currentY][x];
        currentY++;
    }

    return { word, startX: x, startY };
}

function calculateWordPoints(word, boardState, startX, startY, isHorizontal) {
    let totalPoints = 0;
    let wordMultiplier = 1;
    let x = startX;
    let y = startY;

    // Bonus karelerin kontrolü
    const bonusTiles = {
        K3: [
            { row: 0, col: 2 }, { row: 0, col: 12 },
            { row: 2, col: 0 }, { row: 2, col: 14 },
            { row: 12, col: 0 }, { row: 12, col: 14 },
            { row: 14, col: 2 }, { row: 14, col: 12 },
        ],
        H3: [
            { row: 1, col: 1 }, { row: 1, col: 13 },
            { row: 4, col: 4 }, { row: 4, col: 10 },
            { row: 10, col: 4 }, { row: 10, col: 10 },
            { row: 13, col: 1 }, { row: 13, col: 13 },
        ],
        K2: [
            { row: 3, col: 3 }, { row: 3, col: 11 },
            { row: 7, col: 2 }, { row: 7, col: 12 },
            { row: 11, col: 3 }, { row: 11, col: 11 },
            { row: 12, col: 7 }, { row: 2, col: 7 },
        ],
        H2: [
            { row: 0, col: 5 }, { row: 0, col: 9 },
            { row: 1, col: 6 }, { row: 1, col: 8 },
            { row: 5, col: 0 }, { row: 5, col: 5 }, { row: 5, col: 9 }, { row: 5, col: 14 },
            { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 6, col: 8 }, { row: 6, col: 13 },
            { row: 8, col: 1 }, { row: 8, col: 6 }, { row: 8, col: 8 }, { row: 8, col: 13 },
            { row: 9, col: 0 }, { row: 9, col: 5 }, { row: 9, col: 9 }, { row: 9, col: 14 },
            { row: 13, col: 5 }, { row: 13, col: 9 },
            { row: 14, col: 6 }, { row: 14, col: 8 },
        ],
        CENTER: [{ row: 7, col: 7 }]
    };

    // Bonus kontrol fonksiyonu
    function isBonusTile(x, y, bonusType) {
        return bonusTiles[bonusType].some(tile => tile.row === y && tile.col === x);
    }

    // Her harfi kontrol et
    for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        let letterPoints = letterPointsMap[letter] || 1;

        // Eğer harf H2 veya H3'teyse, sadece bu harfi etkiler
        if (isBonusTile(x, y, 'H3')) {
            letterPoints *= 3;
        } else if (isBonusTile(x, y, 'H2')) {
            letterPoints *= 2;
        }

        totalPoints += letterPoints;

        // Eğer K2 veya K3 varsa, tüm kelimenin puanını artır
        if (isBonusTile(x, y, 'K3')) {
            wordMultiplier *= 3;
        } else if (isBonusTile(x, y, 'K2')) {
            wordMultiplier *= 2;
        }

        // Hareketi yatay veya dikey olarak kontrol et
        if (isHorizontal) {
            x++;
        } else {
            y++;
        }
    }

    // Tüm kelimenin puanını multiplier ile çarp
    return totalPoints * wordMultiplier;
}



function validateWordExtension(boardState, x, y, letter, isHorizontal) {
    let isValid = true;

    // Yatay kelime için başa veya sona eklenen harfi kontrol et
    if (isHorizontal) {
        // Başlangıçtan önce harf var mı?
        let startX = x;
        while (startX > 0 && boardState[y][startX - 1] !== '') {
            startX--;
        }

        // Eğer harf önceki kelimenin başına ekleniyorsa
        if (x - startX > 0) { // Eğer sola doğru bir kelime varsa
            let wordBefore = '';
            for (let i = startX; i < x; i++) {
                wordBefore += boardState[y][i];
            }
            if (!validWordsSet.has(wordBefore.toLowerCase())) {
                isValid = false;
            }
        }

        // Sonraki harf ile birleştir
        let wordAfter = letter; // Burada harfi ekledik
        let currentX = x + 1;
        while (currentX < boardState[0].length && boardState[y][currentX] !== '') {
            wordAfter += boardState[y][currentX];
            currentX++;
        }
        if (!validWordsSet.has(wordAfter.toLowerCase())) {
            isValid = false;
        }

        // Sonuna eklenen harf kontrolü
        if (y + 1 < boardState.length && boardState[y + 1][x] !== '') {
            let wordDown = letter;
            let currentY = y + 1;
            while (currentY < boardState.length && boardState[currentY][x] !== '') {
                wordDown += boardState[currentY][x];
                currentY++;
            }
            if (!validWordsSet.has(wordDown.toLowerCase())) {
                isValid = false;
            }
        }
    } else {
        // Dikey kelime için başa veya sona eklenen harfi kontrol et
        let startY = y;
        while (startY > 0 && boardState[startY - 1][x] !== '') {
            startY--;
        }

        // Eğer harf önceki kelimenin başına ekleniyorsa
        if (y - startY > 0) { // Eğer yukarıya doğru bir kelime varsa
            let wordBefore = '';
            for (let i = startY; i < y; i++) {
                wordBefore += boardState[i][x];
            }
            if (!validWordsSet.has(wordBefore.toLowerCase())) {
                isValid = false;
            }
        }

        // Sonraki harf ile birleştir
        let wordAfter = letter; // Burada harfi ekledik
        let currentY = y + 1;
        while (currentY < boardState.length && boardState[currentY][x] !== '') {
            wordAfter += boardState[currentY][x];
            currentY++;
        }
        if (!validWordsSet.has(wordAfter.toLowerCase())) {
            isValid = false;
        }

        // Sonuna eklenen harf kontrolü
        if (x + 1 < boardState[0].length && boardState[y][x + 1] !== '') {
            let wordRight = letter;
            let currentX = x + 1;
            while (currentX < boardState[0].length && boardState[y][currentX] !== '') {
                wordRight += boardState[y][currentX];
                currentX++;
            }
            if (!validWordsSet.has(wordRight.toLowerCase())) {
                isValid = false;
            }
        }
    }

    return isValid;
}


function validateMove(boardState, placedTiles, firstMove) {
    let validWords = [];
    let totalPoints = 0;

    if (firstMove) {
        const isFirstMoveValid = placedTiles.some(tile => tile.x === 7 && tile.y === 7);
        if (!isFirstMoveValid) {
            throw new Error("İlk hamlede merkez karesi (7,7) kullanılmalıdır.");
        }
    }

    // Yeni taşları yerleştir
    placedTiles.forEach(tile => {
        const { x, y, letter } = tile;
        if (!letter || boardState[y][x] !== '') {
            throw new Error(`Bu koordinat (${x}, ${y}) zaten dolu veya hatalı.`);
        }


        // Her harf için komşu taş kontrolü
        let isValid = false;
        for (let i = 0; i < placedTiles.length; i++) {
            const tile = placedTiles[i];
            if (hasAdjacentTile(boardState, tile.x, tile.y)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            throw new Error("Yazılan kelimede en az bir komşu taş olmalıdır.");
        }

        // Harfi yerleştir
        boardState[y][x] = letter;

        // Burada validateWordExtension fonksiyonunu çağırıyoruz
        if (!validateWordExtension(boardState, x, y, letter, true) && !validateWordExtension(boardState, x, y, letter, false)) {
            throw new Error(`Geçersiz kelime: ${letter}`);
        }
    });

    // Kontrol edilecek kelimeler
    let wordsToCheck = [];

    placedTiles.forEach(tile => {
        const { x, y } = tile;

        // Yatay kelime çıkarma
        const horizontal = extractWordHorizontal(boardState, x, y);
        if (horizontal.word.length > 1) {
            wordsToCheck.push({ ...horizontal, isHorizontal: true });
        }

        // Dikey kelime çıkarma
        const vertical = extractWordVertical(boardState, x, y);
        if (vertical.word.length > 1) {
            wordsToCheck.push({ ...vertical, isHorizontal: false });
        }
    });

    // Tekrar eden kelimeleri kaldır
    const uniqueWords = new Map();
    wordsToCheck.forEach(({ word, startX, startY, isHorizontal }) => {
        if (!uniqueWords.has(word)) {
            uniqueWords.set(word, { startX, startY, isHorizontal });
        }
    });

    uniqueWords.forEach((info, word) => {
        const lowerWord = word.toLowerCase();

        // Geçerli kelime setine bakarak kelimeyi doğrula
        if (validWordsSet.has(lowerWord)) {
            validWords.push(word);
            totalPoints += calculateWordPoints(word, boardState, info.startX, info.startY, info.isHorizontal);
        } else {
            throw new Error(`Geçersiz kelime: ${word}`);
        }
    });

    return { validWords, totalPoints };
}


// Taşın etrafında komşu bir taş var mı
function hasAdjacentTile(boardState, x, y) {
    const adjacentPositions = [
        { x: x - 1, y }, { x: x + 1, y },
        { x, y: y - 1 }, { x, y: y + 1 }
    ];
    
    return adjacentPositions.some(pos =>
        pos.x >= 0 && pos.x < boardState[0].length &&
        pos.y >= 0 && pos.y < boardState.length &&
        boardState[pos.y][pos.x] !== ''
    );
}




// Ana Controller Fonksiyonları
module.exports = {
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
                totalPoints,
                firstMove
            });

            await move.save();

            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({ message: "Oyun bulunamadı." });
            }

            const nextPlayerId = (game.currentTurn.toString() === playerId.toString())
                ? game.players[1]._id
                : game.players[0]._id;

            game.currentTurn = nextPlayerId;
            await game.save();

            return res.status(201).json({ message: "Hamle başarıyla kaydedildi.", move });

        } catch (err) {
            console.error(err);
            return res.status(400).json({ message: err.message });
        }
    },

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
