import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/prisma/client';
import ws from 'ws';

// Em ambiente Node.js, o driver Neon serverless precisa de WebSocket.
// Em produção edge (Vercel Edge, Cloudflare Workers), remover esta linha.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL não definida nas variáveis de ambiente');
}

// PrismaNeon aceita PoolConfig — passa a connection string diretamente
const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
