const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Controller untuk menangani Autentikasi User
 */

// 1. REGISTER (Logic dari register.php)
exports.register = async (req, res) => {
    const { username, password } = req.body;

    // Validasi input kosong
    if (!username || !password) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Username dan password wajib diisi' 
        });
    }

    try {
        // Hash password agar aman (BCRYPT)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan ke database
        const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
        await db.query(sql, [username.trim(), hashedPassword]);

        res.status(201).json({ 
            status: 'success', 
            message: 'Registrasi berhasil' 
        });

    } catch (err) {
        // Cek jika username sudah ada (Duplicate Entry)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Username sudah digunakan' 
            });
        }
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Terjadi kesalahan sistem' 
        });
    }
};

// 2. LOGIN (Logic dari login.php)
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Username dan password harus diisi' 
        });
    }

    try {
        // Cari user berdasarkan username
        const sql = "SELECT id, username, password FROM users WHERE username = ?";
        const [rows] = await db.query(sql, [username.trim()]);
        const user = rows[0];

        // Jika user ditemukan, bandingkan password (plain vs hash)
        if (user && await bcrypt.compare(password, user.password)) {
            
            // Simpan data ke session (Sama seperti $_SESSION di PHP)
            req.session.user_id = user.id;
            req.session.username = user.username;

            res.json({
                status: 'success',
                message: 'Login berhasil',
                user: { username: user.username }
            });
        } else {
            res.status(401).json({ 
                status: 'error', 
                message: 'Username atau password salah' 
            });
        }

    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Gagal melakukan login' 
        });
    }
};

// 3. LOGOUT (Logic dari logout.php)
exports.logout = (req, res) => {
    // Hapus session dari server
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                status: 'error', 
                message: 'Gagal logout' 
            });
        }
        
        // Hapus cookie session di client
        res.clearCookie('connect.sid'); 
        res.json({ 
            status: 'success', 
            message: 'Logged out' 
        });
    });
};

// 4. CHECK AUTH STATUS (Opsional - untuk cek di Frontend Vue/React)
exports.checkStatus = (req, res) => {
    if (req.session.user_id) {
        res.json({ 
            isLoggedIn: true, 
            user: { username: req.session.username } 
        });
    } else {
        res.json({ isLoggedIn: false });
    }
};