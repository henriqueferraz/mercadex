import { productsRepository, categoriesRepository } from './products.repository';
import type {
    CreateProductInput,
    UpdateProductInput,
    ProductFiltersInput,
    CreateCategoryInput,
} from './products.dto';

export const productsService = {
    async list(filters: ProductFiltersInput) {
        return productsRepository.findMany(filters);
    },

    async getById(id: string) {
        const product = await productsRepository.findById(id);
        if (!product) throw new Error('PRODUCT_NOT_FOUND');
        return product;
    },

    async create(data: CreateProductInput, sellerId: string) {
        const category = await categoriesRepository.findById(data.categoryId);
        if (!category) throw new Error('CATEGORY_NOT_FOUND');

        return productsRepository.create({ ...data, sellerId });
    },

    async update(id: string, data: UpdateProductInput) {
        const product = await productsRepository.findById(id);
        if (!product) throw new Error('PRODUCT_NOT_FOUND');

        if (data.categoryId) {
            const category = await categoriesRepository.findById(data.categoryId);
            if (!category) throw new Error('CATEGORY_NOT_FOUND');
        }

        return productsRepository.update(id, data);
    },

    async remove(id: string) {
        const product = await productsRepository.findById(id);
        if (!product) throw new Error('PRODUCT_NOT_FOUND');

        await productsRepository.softDelete(id);
    },
};

export const categoriesService = {
    async list() {
        return categoriesRepository.findAll();
    },

    async create(data: CreateCategoryInput) {
        const existing = await categoriesRepository.findByName(data.name);
        if (existing) throw new Error('CATEGORY_ALREADY_EXISTS');

        return categoriesRepository.create(data);
    },
};
