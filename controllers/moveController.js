//controller/moveController.js
const Move = require('../models/Move');
const Game = require('../models/Game');
const { validWordsSet, letterPointsMap } = require('../utils/wordUtils');
function extractWordHorizontal(boardState, x, y) {
    let startX = x;
    // Başlangıcı bul
    while (startX > 0 && boardState[y][startX - 1] !== '') {
        startX--;
    }

    let word = '';
    let currentX = startX;
    while (currentX < boardState[0].length && boardState[y][currentX] !== '') {
        word += boardState[y][currentX];
        currentX++;
    }

    // Boşluk kontrolü: Eğer (startX, currentX) arasında boşluk varsa geçersiz
    for (let i = startX; i < currentX; i++) {
        if (boardState[y][i] === '') {
            return { word: '', startX: -1, startY: y };  // geçersiz kelime
        }
    }

    return { word, startX, startY: y };
}

function extractWordVertical(boardState, x, y) {
    let startY = y;
    // Başlangıcı bul
    while (startY > 0 && boardState[startY - 1][x] !== '') {
        startY--;
    }

    let word = '';
    let currentY = startY;
    while (currentY < boardState.length && boardState[currentY][x] !== '') {
        word += boardState[currentY][x];
        currentY++;
    }

    // Boşluk kontrolü
    for (let i = startY; i < currentY; i++) {
        if (boardState[i][x] === '') {
            return { word: '', startX: x, startY: -1 };  // geçersiz kelime
        }
    }

    return { word, startX: x, startY };
}

/*function validateWordExtension(boardState, x, y, letter, isHorizontal) {
    const newBoard = boardState.map(row => row.slice());
    newBoard[y][x] = letter;  // Yeni harfi tahtaya yerleştir

    const wordsToCheck = new Set();
    let formedWords = 0;

    // Yatay kelimeyi çıkar (varsa)
    let hStartX = x;
    while (hStartX > 0 && newBoard[y][hStartX - 1] !== '') {
        hStartX--;
    }
    let hWord = '';
    let hX = hStartX;
    while (hX < newBoard[0].length && newBoard[y][hX] !== '') {
        hWord += newBoard[y][hX];
        hX++;
    }
    if (hWord.length > 1) {
        wordsToCheck.add(hWord.toLocaleLowerCase('tr'));
        formedWords++;
    }

    // Dikey kelimeyi çıkar (varsa)
    let vStartY = y;
    while (vStartY > 0 && newBoard[vStartY - 1][x] !== '') {
        vStartY--;
    }
    let vWord = '';
    let vY = vStartY;
    while (vY < newBoard.length && newBoard[vY][x] !== '') {
        vWord += newBoard[vY][x];
        vY++;
    }
    if (vWord.length > 1) {
        wordsToCheck.add(vWord.toLocaleLowerCase('tr'));
        formedWords++;
    }

    // Eğer birden fazla kelime oluşuyorsa, geçersiz
    if (formedWords > 1) {
        return false; // Birden fazla kelime oluştu, geçersiz
    }

    // Yalnızca mevcut kelimelerle bağlantılı harf eklemelerine izin ver
    if (wordsToCheck.size === 0) {
        return false; // Hiçbir bağlantılı kelime yoksa, geçerli değil
    }

    // Tüm çıkarılan kelimeleri kontrol et
    for (let word of wordsToCheck) {
        if (!validWordsSet.has(word)) {
            return false; // Eğer kelime geçerli değilse, geçersiz
        }
    }

    // Yeni harf ile bağlantılı geçerli kelimeler bulunduysa, geçerli
    return true;
}*/




/*function extractWordHorizontal(boardState, x, y) {
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
}*/
function updateGameStatsWithTiles(game, placedTiles) {
    if (!game.matchedMines) game.matchedMines = [];
    if (!game.matchedRewards) game.matchedRewards = [];

    placedTiles.forEach(({ x, y }) => {
        // Mine eşleşmelerini kontrol et
        const matchedMine = game.mines.find(m => m.row === y && m.col === x);
        if (matchedMine) {
            game.matchedMines.push({ row: y, col: x, type: matchedMine.type });
        }

        // Reward eşleşmelerini kontrol et
        const matchedReward = game.rewards.find(r => r.row === y && r.col === x);
        if (matchedReward) {
            game.matchedRewards.push({ row: y, col: x, type: matchedReward.type });
        }
    });
}


function calculateWordPoints(word, boardState, startX, startY, isHorizontal, game, playerId) {
    let totalPoints = 0;
    let wordMultiplier = 1;
    let x = startX;
    let y = startY;
    const bonusTiles = {
        K3: [
            { row: 0, col: 2 }, { row: 0, col: 12 }, { row: 2, col: 0 }, { row: 2, col: 14 },
            { row: 12, col: 0 }, { row: 12, col: 14 }, { row: 14, col: 2 }, { row: 14, col: 12 }
        ],
        H3: [
            { row: 1, col: 1 }, { row: 1, col: 13 }, { row: 4, col: 4 }, { row: 4, col: 10 },
            { row: 10, col: 4 }, { row: 10, col: 10 }, { row: 13, col: 1 }, { row: 13, col: 13 }
        ],
        K2: [
            { row: 3, col: 3 }, { row: 3, col: 11 }, { row: 7, col: 2 }, { row: 7, col: 12 },
            { row: 11, col: 3 }, { row: 11, col: 11 }, { row: 12, col: 7 }, { row: 2, col: 7 }
        ],
        H2: [
            { row: 0, col: 5 }, { row: 0, col: 9 }, { row: 1, col: 6 }, { row: 1, col: 8 },
            { row: 5, col: 0 }, { row: 5, col: 5 }, { row: 5, col: 9 }, { row: 5, col: 14 },
            { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 6, col: 8 }, { row: 6, col: 13 },
            { row: 8, col: 1 }, { row: 8, col: 6 }, { row: 8, col: 8 }, { row: 8, col: 13 },
            { row: 9, col: 0 }, { row: 9, col: 5 }, { row: 9, col: 9 }, { row: 9, col: 14 },
            { row: 13, col: 5 }, { row: 13, col: 9 }, { row: 14, col: 6 }, { row: 14, col: 8 }
        ],
        CENTER: [{ row: 7, col: 7 }]
    };
    const isBonusTile = (x, y, type) =>
        bonusTiles[type].some(tile => tile.row === y && tile.col === x);
    const affectedMines = [];
    let isExtraMoveBlocked = false;
    for (let i = 0; i < word.length; i++) {
        const letter = word[i].toUpperCase();
        const currentX = isHorizontal ? startX + i : startX;
        const currentY = isHorizontal ? startY : startY + i;
        let letterPoints = letterPointsMap[letter] || 1;
        if (game.mines.some(mine => mine.type === 'ekstra_hamle_engeli')) {
            isExtraMoveBlocked = true;
        }
        if (isExtraMoveBlocked) {
            if (isBonusTile(currentX, currentY, 'H3')) {
                letterPoints = letterPoints; 
            } else if (isBonusTile(currentX, currentY, 'H2')) {
                letterPoints = letterPoints; 
            }
        } else {
            if (isBonusTile(currentX, currentY, 'H3')) {
                letterPoints *= 3;
            } else if (isBonusTile(currentX, currentY, 'H2')) {
                letterPoints *= 2;
            }
        }
        totalPoints += letterPoints;
        if (isBonusTile(currentX, currentY, 'K3')) {
            wordMultiplier *= 3;
        } else if (isBonusTile(currentX, currentY, 'K2')) {
            wordMultiplier *= 2;
        }
        const mine = game.mines.find(m => m.row === currentY && m.col === currentX);
        if (mine) affectedMines.push(mine);
    }
    for (const mine of affectedMines) {
        switch (mine.type) {
            case 'puan_bolunmesi':
                totalPoints = Math.floor(totalPoints * 0.3);
                break;
                case 'puan_transferi':
                    const opponentId = game.players.find(id => id.toString() !== playerId.toString());
        
                    // Rakip oyuncuya puan ekleniyor
                    game.scores = game.scores.map(score =>
                        score.player.toString() === opponentId.toString()
                            ? { ...score, score: score.score + totalPoints }  // Rakip oyuncuya puan ekleniyor
                            : score
                    );
        
                    // Skor sıfırlanıyor
                    totalPoints = 0;
                    break;
            case 'ekstra_hamle_engeli':
                wordMultiplier = 1;
                break;
            case 'kelime_iptali':
                totalPoints = 0;
                break;
            default:
                break;
        }
    }

    return totalPoints * wordMultiplier;
}
/*function validateWordExtension(boardState, x, y, letter, isHorizontal) {
    let isValid = true;
    if (isHorizontal) {
        let startX = x;
        while (startX > 0 && boardState[y][startX - 1] !== '') {
            startX--;
        }
        if (x - startX > 0) { 
            let wordBefore = '';
            for (let i = startX; i < x; i++) {
                wordBefore += boardState[y][i];
            }
            if (!validWordsSet.has(wordBefore.toLocaleLowerCase('tr'))) {
                isValid = false;
            }
        }
        let wordAfter = letter;
        let currentX = x + 1;
        while (currentX < boardState[0].length && boardState[y][currentX] !== '') {
            wordAfter += boardState[y][currentX];
            currentX++;
        }
        if (!validWordsSet.has(wordAfter.toLocaleLowerCase('tr'))) {
            isValid = false;
        }
        if (y + 1 < boardState.length && boardState[y + 1][x] !== '') {
            let wordDown = letter;
            let currentY = y + 1;
            while (currentY < boardState.length && boardState[currentY][x] !== '') {
                wordDown += boardState[currentY][x];
                currentY++;
            }
            if (!validWordsSet.has(wordDown.toLocaleLowerCase('tr'))) {
                isValid = false;
            }
        }
    } else {
        let startY = y;
        while (startY > 0 && boardState[startY - 1][x] !== '') {
            startY--;
        }
        if (y - startY > 0) { 
            let wordBefore = '';
            for (let i = startY; i < y; i++) {
                wordBefore += boardState[i][x];
            }
            if (!validWordsSet.has(wordBefore.toLocaleLowerCase('tr'))) {
                isValid = false;
            }
        }
        let wordAfter = letter; 
        let currentY = y + 1;
        while (currentY < boardState.length && boardState[currentY][x] !== '') {
            wordAfter += boardState[currentY][x];
            currentY++;
        }
        if (!validWordsSet.has(wordAfter.toLocaleLowerCase('tr'))) {
            isValid = false;
        }
        if (x + 1 < boardState[0].length && boardState[y][x + 1] !== '') {
            let wordRight = letter;
            let currentX = x + 1;
            while (currentX < boardState[0].length && boardState[y][currentX] !== '') {
                wordRight += boardState[y][currentX];
                currentX++;
            }
            if (!validWordsSet.has(wordRight.toLocaleLowerCase('tr'))) {
                isValid = false;
            }
        }
    }
    return isValid;
}*/function validateWordExtension(boardState, x, y, letter, isHorizontal) {
    const newBoard = boardState.map(row => row.slice());
    newBoard[y][x] = letter;  // Yeni harfi tahtaya yerleştir

    const wordsToCheck = new Set();

    // Yatay kelimeyi çıkar
    let hStartX = x;
    while (hStartX > 0 && newBoard[y][hStartX - 1] !== '') {
        hStartX--;
    }
    let hWord = '';
    let hX = hStartX;
    while (hX < newBoard[0].length && newBoard[y][hX] !== '') {
        hWord += newBoard[y][hX];
        hX++;
    }
    if (hWord.length > 1) {
        wordsToCheck.add(hWord.toLocaleLowerCase('tr'));
    }

    // Dikey kelimeyi çıkar
    let vStartY = y;
    while (vStartY > 0 && newBoard[vStartY - 1][x] !== '') {
        vStartY--;
    }
    let vWord = '';
    let vY = vStartY;
    while (vY < newBoard.length && newBoard[vY][x] !== '') {
        vWord += newBoard[vY][x];
        vY++;
    }
    if (vWord.length > 1) {
        wordsToCheck.add(vWord.toLocaleLowerCase('tr'));
    }

    // Tüm çıkarılan kelimeleri kontrol et
    for (let word of wordsToCheck) {
        if (!validWordsSet.has(word)) {
            return false;
        }
    }

    return true;
}

function validateMove(boardState, placedTiles, firstMove,game, playerId) {
    let validWords = [];
    let totalPoints = 0;

    if (firstMove) {
        const isFirstMoveValid = placedTiles.some(tile => tile.x === 7 && tile.y === 7);
        if (!isFirstMoveValid) {
            throw new Error("İlk hamlede merkez karesi (7,7) kullanılmalıdır.");
        }
    }
   /* if (!firstMove) {
        const isConnectedToOld = placedTiles.some(({ x, y }) =>
            hasAdjacentToOldTiles(boardState, x, y, placedTiles)
        );
        if (!isConnectedToOld) {
            throw new Error("Yeni hamledeki taşlar tahtadaki mevcut taşlara komşu olmalıdır.");
        }
    }*/if (!firstMove) {
    if (placedTiles.length === 0) {
        // Taş yerleştirilmemişse (örneğin pas geçilmişse), komşuluk kontrolü yapılmaz.
        // Burada hiçbir şey yapma veya sadece return et.
    } else {
        const isConnectedToOld = placedTiles.some(({ x, y }) =>
            hasAdjacentToOldTiles(boardState, x, y, placedTiles)
        );

        if (!isConnectedToOld) {
            throw new Error("Yeni hamledeki taşlar tahtadaki mevcut taşlara komşu olmalıdır.");
        }
    }
}
    placedTiles.forEach(tile => {
        const { x, y, letter } = tile;
        if (boardState[y][x] !== '' && boardState[y][x] !== letter) {
            throw new Error(`Bu koordinat (${x}, ${y}) zaten farklı bir harf içeriyor.`);
        }
        
        boardState[y][x] = letter;
        if (!validateWordExtension(boardState, x, y, letter, true) && 
            !validateWordExtension(boardState, x, y, letter, false)) {
            throw new Error(`Geçersiz kelime: ${letter}`);
        }
    });
    let wordsToCheck = [];
    placedTiles.forEach(tile => {
        const { x, y } = tile;
        const horizontal = extractWordHorizontal(boardState, x, y);
        if (horizontal.word.length > 1) {
            wordsToCheck.push({ ...horizontal, isHorizontal: true });
        }
        const vertical = extractWordVertical(boardState, x, y);
        if (vertical.word.length > 1) {
            wordsToCheck.push({ ...vertical, isHorizontal: false });
        }
    });
    const uniqueWords = new Map();
    wordsToCheck.forEach(({ word, startX, startY, isHorizontal }) => {
        if (!uniqueWords.has(word)) {
            uniqueWords.set(word, { startX, startY, isHorizontal });
        }
    });
    uniqueWords.forEach((info, word) => {
        const lowerWord = word.toLocaleLowerCase('tr');
        if (validWordsSet.has(lowerWord)) {
            validWords.push(word);
            totalPoints += calculateWordPoints(word, boardState, info.startX, info.startY, info.isHorizontal, game, playerId);
        } else {
            throw new Error(`Geçersiz kelime: ${word}`);
        }
    });
    const scoreEntry = game.scores.find(s => s.player.toString() === playerId.toString());
    if (scoreEntry) {
        scoreEntry.score += totalPoints;
    } else {
        game.scores.push({ player: playerId, score: totalPoints });
    }
    return { validWords, totalPoints };
}
function hasAdjacentToOldTiles(boardState, x, y, placedTiles) {
    const isPlacedTile = (px, py) => placedTiles.some(t => t.x === px && t.y === py);

    const adjacentPositions = [
        { x: x - 1, y }, { x: x + 1, y },
        { x, y: y - 1 }, { x, y: y + 1 }
    ];

    return adjacentPositions.some(pos =>
        pos.x >= 0 && pos.x < boardState[0].length &&
        pos.y >= 0 && pos.y < boardState.length &&
        boardState[pos.y][pos.x] !== '' &&
        !isPlacedTile(pos.x, pos.y) // 🔥 Komşu ama yeni yerleştirilmemiş olmalı
    );
}
module.exports = {
    async createMove(req, res) {
        try {
            const { gameId, playerId, placedTiles, boardState, firstMove } = req.body;
            console.log("Gelen Hamle Verisi:", req.body);
            if (!gameId || !playerId || !placedTiles || !boardState) {
                return res.status(400).json({ message: "Eksik veri gönderildi." });
            }
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({ message: "Oyun bulunamadı." });
            }
            if (!game.players || game.players.length < 2) {
                return res.status(400).json({ message: "Oyuncu bilgileri eksik." });
            }
            // Eğer oyuncunun sırası değilse, hamlesi reddedilsin
            if (game.currentTurn.toString() !== playerId.toString()) {
                return res.status(400).json({ message: "Sıra sizde değil." });
            }

            const { validWords, totalPoints } = validateMove(boardState, placedTiles, firstMove,game,game.currentTurn);
            const move = new Move({
                gameId,
                playerId,
                placed: placedTiles,
                validWords,
                totalPoints,
                firstMove
            });
            await move.save();
            updateGameStatsWithTiles(game, placedTiles);
            const nextPlayerId = (game.currentTurn.toString() === game.players[0]._id.toString())
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