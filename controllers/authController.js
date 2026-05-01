const db = require('../db/connection');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ status: 'error', message: 'Field wajib diisi' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
        res.json({ status: 'success', message: 'Registrasi berhasil' });
    } catch (err) {
        const msg = err.code === 'ER_DUP_ENTRY' ? 'Username sudah digunakan' : 'Sistem error';
        res.status(500).json({ status: 'error', message: msg });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        const user = rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user_id = user.id;
            req.session.username = user.username;
            res.json({ status: 'success', user: { username: user.username } });
        } else {
            res.status(401).json({ status: 'error', message: 'Login gagal' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.json({ status: 'success', message: 'Logged out' });
};