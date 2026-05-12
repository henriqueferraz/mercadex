import request from 'supertest';
import app from '../../server';
import { prisma } from '../../db';

const RUN_ID = Date.now();
const email = (tag: string) => `prod-${tag}-${RUN_ID}@mercadex.test`;

let adminToken: string;
let categoryId: string;
let productId: string;

// ─── Setup global ─────────────────────────────────────────────────────────────

beforeAll(async () => {
    // Cria usuário admin diretamente no banco para ter token de admin
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');

    const passwordHash = await bcrypt.hash('senha1234', 12);
    const admin = await prisma.user.create({
        data: {
            name: 'Admin Test',
            email: email('admin'),
            passwordHash,
            role: 'ADMIN',
        },
    });

    adminToken = jwt.sign(
        { sub: admin.id, role: admin.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
    );

    // Cria categoria de teste
    const catRes = await request(app)
        .post('/api/products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Categoria-${RUN_ID}`, description: 'Categoria de teste' });

    categoryId = catRes.body.data.id;
});

afterAll(async () => {
    // Limpa dados criados por esta suite
    await prisma.product.deleteMany({ where: { title: { contains: `PROD-${RUN_ID}` } } });
    await prisma.category.deleteMany({ where: { name: { contains: `${RUN_ID}` } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@mercadex.test' } } });
});

// ─── GET /api/products/categories ────────────────────────────────────────────

describe('GET /api/products/categories', () => {
    it('lista categorias sem autenticação', async () => {
        const res = await request(app).get('/api/products/categories');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

// ─── POST /api/products/categories ───────────────────────────────────────────

describe('POST /api/products/categories', () => {
    it('retorna 401 sem autenticação', async () => {
        const res = await request(app)
            .post('/api/products/categories')
            .send({ name: 'Nova Cat' });

        expect(res.status).toBe(401);
    });

    it('retorna 409 para categoria duplicada', async () => {
        const res = await request(app)
            .post('/api/products/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: `Categoria-${RUN_ID}` });

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('retorna 400 para dados inválidos', async () => {
        const res = await request(app)
            .post('/api/products/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'X' }); // min 2 chars — exatamente 1

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
});

// ─── POST /api/products ───────────────────────────────────────────────────────

describe('POST /api/products', () => {
    it('cria produto com dados válidos (admin)', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: `PROD-${RUN_ID}-create`,
                description: 'Produto de teste',
                price: 99.9,
                condition: 'NOVO',
                categoryId,
                stock: 10,
                images: [],
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(`PROD-${RUN_ID}-create`);
        productId = res.body.data.id;
    });

    it('retorna 401 sem autenticação', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ title: 'X', price: 10, condition: 'NOVO', categoryId });

        expect(res.status).toBe(401);
    });

    it('retorna 400 para dados inválidos (preço negativo)', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Produto', price: -1, condition: 'NOVO', categoryId });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('retorna 404 para categoria inexistente', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: `PROD-${RUN_ID}-nocat`,
                price: 10,
                condition: 'NOVO',
                categoryId: '00000000-0000-0000-0000-000000000000',
            });

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
});

// ─── GET /api/products ────────────────────────────────────────────────────────

describe('GET /api/products', () => {
    it('lista produtos sem autenticação', async () => {
        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data).toHaveProperty('totalPages');
    });

    it('filtra por condição', async () => {
        const res = await request(app).get('/api/products?condition=NOVO');

        expect(res.status).toBe(200);
        res.body.data.items.forEach((p: { condition: string }) => {
            expect(p.condition).toBe('NOVO');
        });
    });

    it('retorna 400 para parâmetros inválidos', async () => {
        const res = await request(app).get('/api/products?condition=INVALIDO');

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
    it('retorna produto por id', async () => {
        const res = await request(app).get(`/api/products/${productId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(productId);
    });

    it('retorna 404 para produto inexistente', async () => {
        const res = await request(app).get(
            '/api/products/00000000-0000-0000-0000-000000000000'
        );

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

describe('PUT /api/products/:id', () => {
    it('atualiza produto (admin)', async () => {
        const res = await request(app)
            .put(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: `PROD-${RUN_ID}-updated`, stock: 5 });

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe(`PROD-${RUN_ID}-updated`);
        expect(res.body.data.stock).toBe(5);
    });

    it('retorna 401 sem autenticação', async () => {
        const res = await request(app)
            .put(`/api/products/${productId}`)
            .send({ title: 'Hack' });

        expect(res.status).toBe(401);
    });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
    it('retorna 401 sem autenticação', async () => {
        const res = await request(app).delete(`/api/products/${productId}`);
        expect(res.status).toBe(401);
    });

    it('faz soft delete do produto (admin)', async () => {
        const res = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Produto removido não aparece na listagem pública
        const getRes = await request(app).get(`/api/products/${productId}`);
        expect(getRes.status).toBe(404);
    });
});
