const db = require('../db/connection');

exports.generateQuestion = async (req, res) => {
    const userId = req.session.user_id;
    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    try {
        // Ambil atau Buat Game Session
        let [sessions] = await db.query(
            "SELECT * FROM game_sessions WHERE user_id = ? AND is_active = 1 LIMIT 1", 
            [userId]
        );
        
        let session = sessions[0];
        let difficulty = 'easy';

        if (!session) {
            await db.query(
                "INSERT INTO game_sessions (user_id, current_difficulty, consecutive_correct, consecutive_wrong, score, current_score, lives, is_active) VALUES (?, 'easy', 0, 0, 0, 0, 3, 1)", 
                [userId]
            );
        } else {
            difficulty = session.current_difficulty;
        }

        // Logika Generate Pola Angka
        const patternType = Math.floor(Math.random() * 3) + 1;
        let sequence = [];
        let answer = 0;
        const length = 5;
        let start = Math.floor(Math.random() * 15) + 1;

        switch (difficulty) {
            case 'easy':
                if (patternType === 1) { // Tambah Tetap
                    const step = Math.floor(Math.random() * 4) + 2;
                    for (let i = 0; i < length; i++) sequence.push(start + (i * step));
                    answer = sequence[4] + step;
                } else if (patternType === 2) { // Kurang Tetap
                    start = Math.floor(Math.random() * 21) + 30;
                    const step = Math.floor(Math.random() * 4) + 2;
                    for (let i = 0; i < length; i++) sequence.push(start - (i * step));
                    answer = sequence[4] - step;
                } else { // Selang-seling
                    let curr = start;
                    for (let i = 0; i < length; i++) {
                        sequence.push(curr);
                        curr += (i % 2 === 0) ? 2 : -1;
                    }
                    answer = curr;
                }
                break;

            case 'medium':
                if (patternType === 1) { // Bertingkat
                    let curr = start;
                    for (let i = 1; i <= length; i++) { sequence.push(curr); curr += i; }
                    answer = curr;
                } else if (patternType === 2) { // Perkalian
                    let curr = Math.floor(Math.random() * 2) + 2;
                    for (let i = 0; i < length; i++) { sequence.push(curr); curr *= 2; }
                    answer = curr;
                } else { // Fibonacci
                    let a = Math.floor(Math.random() * 5) + 1;
                    let b = Math.floor(Math.random() * 5) + 1;
                    for (let i = 0; i < length; i++) { 
                        sequence.push(a); 
                        let next = a + b; a = b; b = next; 
                    }
                    answer = a;
                }
                break;

            case 'hard':
                if (patternType === 1) { // Kuadrat
                    let base = Math.floor(Math.random() * 5) + 1;
                    for (let i = 0; i < length; i++) sequence.push(Math.pow(base + i, 2));
                    answer = Math.pow(base + 5, 2);
                } else { // Custom (n * 2) - 1
                    let curr = Math.floor(Math.random() * 4) + 2;
                    for (let i = 0; i < length; i++) { sequence.push(curr); curr = (curr * 2) - 1; }
                    answer = curr;
                }
                break;
        }

        // Simpan jawaban benar di session
        req.session.correct_answer = parseInt(answer);

        res.json({
            status: 'success',
            question: sequence,
            difficulty: difficulty
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 2. SUBMIT ANSWER (Logic dari submit-answer.php)
exports.submitAnswer = async (req, res) => {
    const userId = req.session.user_id;
    const { answer } = req.body; // Ambil dari POST body
    const correctAnswer = req.session.correct_answer;

    if (!userId || correctAnswer === undefined) {
        return res.status(400).json({ status: 'error', message: 'Invalid Session' });
    }

    // Hapus correct_answer dari session setelah dijawab (opsional, tapi lebih aman)
    delete req.session.correct_answer;

    try {
        const [sessions] = await db.query("SELECT * FROM game_sessions WHERE user_id = ? AND is_active = 1 LIMIT 1", [userId]);
        const session = sessions[0];

        if (!session) return res.status(404).json({ status: 'error', message: 'No session found' });

        const isCorrect = (parseInt(answer) === correctAnswer);
        let { score, lives, consecutive_correct, consecutive_wrong, current_difficulty } = session;

        if (isCorrect) {
            score += 10;
            consecutive_correct += 1;
            consecutive_wrong = 0;

            // NAIK LEVEL: 3x Benar
            if (consecutive_correct >= 3) {
                if (current_difficulty === 'easy') current_difficulty = 'medium';
                else if (current_difficulty === 'medium') current_difficulty = 'hard';
                consecutive_correct = 0;
            }
        } else {
            lives -= 1;
            consecutive_correct = 0;
            consecutive_wrong += 1;

            // TURUN LEVEL: 2x Salah
            if (consecutive_wrong >= 2) {
                if (current_difficulty === 'hard') current_difficulty = 'medium';
                else if (current_difficulty === 'medium') current_difficulty = 'easy';
                consecutive_wrong = 0;
            }
        }

        const gameOver = (lives <= 0);

        if (gameOver) {
            // Nonaktifkan session & Simpan ke tabel scores
            await db.query(
                "UPDATE game_sessions SET score = ?, current_score = ?, lives = ?, is_active = 0 WHERE id = ?", 
                [score, score, lives, session.id]
            );
            await db.query(
                "INSERT INTO scores (user_id, final_score, max_difficulty_reached) VALUES (?, ?, ?)", 
                [userId, score, current_difficulty]
            );
        } else {
            // Update status session jalan
            await db.query(
                "UPDATE game_sessions SET score = ?, current_score = ?, lives = ?, consecutive_correct = ?, consecutive_wrong = ?, current_difficulty = ? WHERE id = ?",
                [score, score, lives, consecutive_correct, consecutive_wrong, current_difficulty, session.id]
            );
        }

        res.json({
            status: 'success',
            is_correct: isCorrect,
            correct_answer: correctAnswer,
            current_score: score,
            lives_left: lives,
            difficulty: current_difficulty,
            game_over: gameOver
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Database Error' });
    }
};

// 3. GET RANKINGS (Logic dari get-score.php)
exports.getRankings = async (req, res) => {
    const difficultyFilter = req.query.difficulty || 'all';

    try {
        let sql = `
            SELECT u.username, s.final_score, s.max_difficulty_reached, s.achieved_at 
            FROM scores s 
            JOIN users u ON s.user_id = u.id
        `;
        let params = [];

        if (difficultyFilter !== 'all') {
            sql += " WHERE s.max_difficulty_reached = ?";
            params.push(difficultyFilter);
        }

        sql += " ORDER BY s.final_score DESC LIMIT 10";

        const [rankings] = await db.query(sql, params);
        res.json({ status: 'success', data: rankings });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Gagal memuat dashboard' });
    }
};