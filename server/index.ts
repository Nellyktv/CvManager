import { ensureDemo } from './ensureDemo.js';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import sequelize from './dB.js';
import {allRoutes} from './routes/index.js';
import errorHandler from './middleware/ErrorHandlingMiddleWare.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serverRoot = path.basename(__dirname) === 'dist' ? path.dirname(__dirname) : __dirname;
const clientDist = path.join(serverRoot, '../dist');

const PORT = Number(process.env.PORT ?? 4200);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

app.disable('x-powered-by');
const trustedProxies = process.env.TRUSTED_PROXIES?.split(',').map((value) => value.trim()).filter(Boolean);
if (trustedProxies?.length) app.set('trust proxy', trustedProxies);
app.use((_req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://accounts.google.com",
            "frame-src https://accounts.google.com",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    });
    next();
});
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use('/api', express.json({ limit: '256kb' }), allRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found' }));

app.use(express.static(clientDist));
app.get(/.*/, (req, res, next) => {
    if (req.accepts('html') !== 'html') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
});
app.use(errorHandler);

const start = async () => {
    if (Buffer.byteLength(process.env.SECRET_KEY_ROLE ?? '') < 32) {
        throw new Error('SECRET_KEY_ROLE must contain at least 32 bytes');
    }
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    const server = app.listen(PORT, HOST, () => {
        console.log(`Server started on PORT ${PORT}`);
        if (process.env.RENDER_EXTERNAL_HOSTNAME === 'cvmanager-ousk.onrender.com') {
            void ensureDemo().catch((error: unknown) => {
                console.error('Demo seed failed:', error instanceof Error ? error.message : 'Unknown error');
            });
        }
    });
    server.on('error', (error) => {
        console.error(error.message);
        process.exitCode = 1;
        void sequelize.close();
    });
};

start().catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Server startup failed');
    process.exitCode = 1;
    await sequelize.close();
});
