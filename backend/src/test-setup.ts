import { prisma } from './db';

// Fecha a conexão Prisma após todos os testes para evitar handles abertos
afterAll(async () => {
    await prisma.$disconnect();
});
