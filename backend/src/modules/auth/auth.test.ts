import request from 'supertest';
import app from '../../server';
import { prisma } from '../../db';

// Prefixo único por execução para evitar colisões no banco compartilhado
const RUN_ID = Date.now();
const email = (tag: string) => `test-${tag}-${RUN_ID}@mercadex.test`;

afterAll(async () => {
    // Limpa usuários criados por esta suite
    await prisma.user.deleteMany({
        where: { email: { endsWith: `@mercadex.test` } },
    });
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    it('cria usuário com dados válidos', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test User', email: email('reg-ok'), password: 'senha1234' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            email: email('reg-ok'),
            role: 'CUSTOMER',
        });
        expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('retorna 409 para email duplicado', async () => {
        const dup = email('dup');
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dup User', email: dup, password: 'senha1234' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dup User', email: dup, password: 'senha1234' });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('retorna 400 para dados inválidos (senha curta)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'X', email: 'invalido@test.com', password: '123' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('retorna 400 para email inválido', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test', email: 'nao-e-email', password: 'senha1234' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    const loginEmail = email('login');

    beforeAll(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Login User', email: loginEmail, password: 'senha1234' });
    });

    it('retorna accessToken e seta cookie refreshToken com credenciais válidas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: loginEmail, password: 'senha1234' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.user.email).toBe(loginEmail);
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('retorna 401 para senha incorreta', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: loginEmail, password: 'senhaerrada' });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('retorna 401 para email inexistente', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'naoexiste@mercadex.test', password: 'senha1234' });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
    const refreshEmail = email('refresh');

    it('retorna novo accessToken com refreshToken válido no cookie', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Refresh User', email: refreshEmail, password: 'senha1234' });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: refreshEmail, password: 'senha1234' });

        const cookies = loginRes.headers['set-cookie'] as unknown as string[];

        const res = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
    });

    it('retorna 401 sem cookie refreshToken', async () => {
        const res = await request(app).post('/api/auth/refresh');

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('NO_REFRESH_TOKEN');
    });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
    it('retorna 401 sem token de autenticação', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(401);
    });

    it('realiza logout com token válido', async () => {
        const logoutEmail = email('logout');
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Logout User', email: logoutEmail, password: 'senha1234' });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: logoutEmail, password: 'senha1234' });

        const { accessToken } = loginRes.body.data;

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
