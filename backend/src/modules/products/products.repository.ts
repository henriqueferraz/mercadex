import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../db';
import type { ProductFiltersInput, CreateProductInput, UpdateProductInput } from './products.dto';

export const productsRepository = {
    async findMany(filters: ProductFiltersInput) {
        const { category, search, minPrice, maxPrice, condition, sort, page, limit } = filters;

        const where: Prisma.ProductWhereInput = {
            active: true,
            ...(condition && { condition }),
            ...(category && { category: { name: { equals: category, mode: 'insensitive' } } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...((minPrice !== undefined || maxPrice !== undefined) && {
                price: {
                    ...(minPrice !== undefined && { gte: new Prisma.Decimal(minPrice) }),
                    ...(maxPrice !== undefined && { lte: new Prisma.Decimal(maxPrice) }),
                },
            }),
        };

        const orderBy: Prisma.ProductOrderByWithRelationInput =
            sort === 'price_asc'
                ? { price: 'asc' }
                : sort === 'price_desc'
                    ? { price: 'desc' }
                    : { createdAt: 'desc' };

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: { category: true, seller: { select: { id: true, name: true } } },
            }),
            prisma.product.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    findById(id: string) {
        return prisma.product.findFirst({
            where: { id, active: true },
            include: { category: true, seller: { select: { id: true, name: true } } },
        });
    },

    create(data: CreateProductInput & { sellerId: string }) {
        return prisma.product.create({
            data: {
                title: data.title,
                description: data.description,
                price: new Prisma.Decimal(data.price),
                condition: data.condition,
                categoryId: data.categoryId,
                sellerId: data.sellerId,
                stock: data.stock,
                images: data.images,
            },
            include: { category: true },
        });
    },

    update(id: string, data: UpdateProductInput) {
        return prisma.product.update({
            where: { id },
            data: {
                ...data,
                ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
            },
            include: { category: true },
        });
    },

    softDelete(id: string) {
        return prisma.product.update({
            where: { id },
            data: { active: false },
        });
    },
};

export const categoriesRepository = {
    findAll() {
        return prisma.category.findMany({ orderBy: { name: 'asc' } });
    },

    findById(id: string) {
        return prisma.category.findUnique({ where: { id } });
    },

    findByName(name: string) {
        return prisma.category.findUnique({ where: { name } });
    },

    create(data: { name: string; description?: string }) {
        return prisma.category.create({ data });
    },
};
