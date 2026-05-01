const db = require('../db/connection');

exports.generateQuestion = async (req, res) => {
    const userId = req.session.user_id;
    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    try {
        // 1. Cek atau Buat Session
        let [sessions] = await db.query("SELECT * FROM game_sessions WHERE user_id = ? AND is_active = 1 LIMIT 1", [userId]);
        let session = sessions[0];
        let difficulty = session ? session.current_difficulty : 'easy';

        if (!session) {
            await db.query("INSERT INTO game_sessions (user_id, current_difficulty, lives, is_active) VALUES (?, 'easy', 3, 1)", [userId]);
        }

        // 2. Logika Generate Pola (Logic lo di PHP dipindah ke sini)
        let sequence = [], answer = 0, length = 5, start = Math.floor(Math.random() * 15) + 1;
        const type = Math.floor(Math.random() * 3) + 1;

        if (difficulty === 'easy') {
            const step = Math.floor(Math.random() * 4) + 2;
            if (type === 1) { // Tambah
                for (let i = 0; i < length; i++) sequence.push(start + (i * step));
                answer = sequence[4] + step;
            } else if (type === 2) { // Kurang
                start = 40;
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
        }
        // ... (Tambahkan logic Medium & Hard lo di sini)

        req.session.correct_answer = answer; // Simpan di session express
        res.json({ status: 'success', question: sequence, difficulty });

    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getRankings = async (req, res) => {
    const diff = req.query.difficulty || 'all';
    let sql = "SELECT u.username, s.final_score, s.max_difficulty_reached FROM scores s JOIN users u ON s.user_id = u.id";
    let params = [];

    if (diff !== 'all') {
        sql += " WHERE s.max_difficulty_reached = ?";
        params.push(diff);
    }
    sql += " ORDER BY s.final_score DESC LIMIT 10";

    const [rows] = await db.query(sql, params);
    res.json({ status: 'success', data: rows });
};