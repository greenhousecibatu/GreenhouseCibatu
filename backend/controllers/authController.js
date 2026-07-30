// =============================================
// Auth Controller - Password-only Login
// =============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'greenhouse-cibatu-secret-2026';
const TOKEN_EXPIRY = '7d'; // Token berlaku 7 hari

// Password di-hash menggunakan bcrypt (kopicibatu)
const HASHED_PASSWORD = bcrypt.hashSync('kopicibatu', 10);

const AuthController = {
    login: async (req, res) => {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Password harus diisi.' });
            }

            const isValid = await bcrypt.compare(password, HASHED_PASSWORD);

            if (!isValid) {
                return res.status(401).json({ error: 'Password salah.' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { role: 'operator', iat: Math.floor(Date.now() / 1000) },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            res.json({
                message: 'Login berhasil',
                token,
                expiresIn: TOKEN_EXPIRY
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Terjadi kesalahan server.' });
        }
    },

    verify: async (req, res) => {
        // If this endpoint is reached, the token is valid (middleware already checked)
        res.json({ valid: true, user: req.user });
    }
};

module.exports = AuthController;
