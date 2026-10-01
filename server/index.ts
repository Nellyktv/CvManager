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

const PORT = process.env.PORT || 4200;

const app = express();

app.use(cors({origin:'http://localhost:5173'}))
app.use(express.json())
app.use('/api',allRoutes)
app.use(errorHandler)

app.use(express.static(clientDist))

app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
})


const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({ alter: true })
        app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
    }
    catch (e) {
        console.log(e);
    }
};

start();
