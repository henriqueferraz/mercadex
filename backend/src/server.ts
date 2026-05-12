import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', async (_req, res) => {
    try {
        // Verifica conectividade com o banco
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
    }
});

app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
});

export default app;
