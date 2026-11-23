import 'dotenv/config';
import sequelize from './dB.js';
import { ensureDemo } from './ensureDemo.js';

ensureDemo().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
}).finally(() => sequelize.close());
