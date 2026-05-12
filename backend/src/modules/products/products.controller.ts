import type { Request, Response } from 'express';
import { productsService, categoriesService } from './products.service';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductFiltersDto,
    CreateCategoryDto,
} from './products.dto';
import type { AuthRequest } from '../auth/auth.middleware';

export const productsController = {
    async list(req: Request, res: Response) {
        const parsed = ProductFiltersDto.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
            });
            return;
        }
        try {
            const result = await productsService.list(parsed.data);
            res.json({ success: true, data: result });
        } catch {
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const product = await productsService.getById(req.params['id'] as string);
            res.json({ success: true, data: product });
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'PRODUCT_NOT_FOUND') {
                res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND' } });
                return;
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async create(req: AuthRequest, res: Response) {
        const parsed = CreateProductDto.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
            });
            return;
        }
        try {
            const sellerId = req.user!.id;
            const product = await productsService.create(parsed.data, sellerId);
            res.status(201).json({ success: true, data: product });
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
                res.status(404).json({ success: false, error: { code: 'CATEGORY_NOT_FOUND' } });
                return;
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async update(req: Request, res: Response) {
        const parsed = UpdateProductDto.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
            });
            return;
        }
        try {
            const product = await productsService.update(req.params['id'] as string, parsed.data);
            res.json({ success: true, data: product });
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message === 'PRODUCT_NOT_FOUND') {
                    res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND' } });
                    return;
                }
                if (err.message === 'CATEGORY_NOT_FOUND') {
                    res.status(404).json({ success: false, error: { code: 'CATEGORY_NOT_FOUND' } });
                    return;
                }
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            await productsService.remove(req.params['id'] as string);
            res.json({ success: true, data: { message: 'Produto removido' } });
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'PRODUCT_NOT_FOUND') {
                res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND' } });
                return;
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },
};

export const categoriesController = {
    async list(_req: Request, res: Response) {
        try {
            const categories = await categoriesService.list();
            res.json({ success: true, data: categories });
        } catch {
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async create(req: Request, res: Response) {
        const parsed = CreateCategoryDto.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
            });
            return;
        }
        try {
            const category = await categoriesService.create(parsed.data);
            res.status(201).json({ success: true, data: category });
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'CATEGORY_ALREADY_EXISTS') {
                res.status(409).json({ success: false, error: { code: 'CATEGORY_ALREADY_EXISTS' } });
                return;
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },
};
