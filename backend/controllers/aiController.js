const { GoogleGenAI } = require('@google/genai');

const DEFAULT_REALTIME_MODEL = 'gemini-3.1-flash-live-preview';
const DEFAULT_REALTIME_VOICE = 'Kore';

const AiController = {
    createRealtimeToken: async (req, res) => {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_LIVE_MODEL || DEFAULT_REALTIME_MODEL;
        const voice = process.env.GEMINI_LIVE_VOICE || DEFAULT_REALTIME_VOICE;

        if (!apiKey) {
            return res.status(503).json({
                code: 'AI_NOT_CONFIGURED',
                error: 'Asisten AI belum dikonfigurasi oleh pengelola.'
            });
        }

        try {
            const client = new GoogleGenAI({
                apiKey,
                httpOptions: { apiVersion: 'v1alpha' }
            });
            const token = await client.authTokens.create({
                config: {
                    uses: 1,
                    expireTime: new Date(Date.now() + (30 * 60 * 1000)).toISOString(),
                    newSessionExpireTime: new Date(Date.now() + (60 * 1000)).toISOString(),
                    httpOptions: { apiVersion: 'v1alpha' }
                }
            });

            if (!token.name) throw new Error('Gemini tidak mengembalikan ephemeral token.');

            res.set('Cache-Control', 'no-store');
            return res.json({
                value: token.name,
                expires_at: token.expireTime,
                model,
                voice
            });
        } catch (error) {
            const status = Number(error.status || error.code || 0);
            console.error('Gemini Live token generation failed:', status || 'unknown', error.message);

            if (status === 400 || status === 403) {
                return res.status(502).json({
                    code: 'AI_KEY_REJECTED',
                    error: 'Kunci Gemini ditolak atau model Live belum tersedia untuk proyek ini.'
                });
            }

            if (status === 429) {
                return res.status(503).json({
                    code: 'AI_QUOTA_EXCEEDED',
                    error: 'Kuota gratis Gemini Live sedang habis. Coba lagi setelah kuota tersedia.'
                });
            }

            return res.status(502).json({
                code: 'AI_CONNECTION_FAILED',
                error: 'Gagal menyiapkan sesi percakapan AI.'
            });
        }
    }
};

module.exports = AiController;
