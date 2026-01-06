import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';

describe('ProductsService', () => {
    let service: ProductsService;
    let mockSupabase: any;

    const mockProduct = {
        id: 'prod-1',
        restaurant_id: 'rest-1',
        category_id: 'cat-1',
        name: 'Pizza Margherita',
        description: 'Delicious pizza',
        price: 25.50,
        is_available: true,
        categories: {
            id: 'cat-1',
            name: 'Pizzas',
        },
    };

    beforeEach(async () => {
        // Mock Supabase client
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: SUPABASE_CLIENT,
                    useValue: mockSupabase,
                },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all products for a restaurant', async () => {
            const products = [mockProduct];
            mockSupabase.from.mockReturnValue(mockSupabase);
            mockSupabase.single = jest.fn().mockResolvedValue({ data: products, error: null });

            // Mock the chain
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'order').mockResolvedValue({ data: products, error: null });

            const result = await service.findAll('rest-1');

            expect(result).toEqual(products);
            expect(mockSupabase.from).toHaveBeenCalledWith('products');
            expect(mockSupabase.eq).toHaveBeenCalledWith('restaurant_id', 'rest-1');
        });

        it('should filter by category when provided', async () => {
            const products = [mockProduct];
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'order').mockResolvedValue({ data: products, error: null });

            await service.findAll('rest-1', 'cat-1');

            expect(mockSupabase.eq).toHaveBeenCalledWith('category_id', 'cat-1');
        });

        it('should throw error when database fails', async () => {
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'order').mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            });

            await expect(service.findAll('rest-1')).rejects.toThrow('Error al obtener productos');
        });
    });

    describe('findOne', () => {
        it('should return a single product by id', async () => {
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({ data: mockProduct, error: null });

            const result = await service.findOne('prod-1');

            expect(result).toEqual(mockProduct);
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'prod-1');
        });

        it('should throw NotFoundException when product not found', async () => {
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({ data: null, error: { message: 'Not found' } });

            await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new product', async () => {
            const createDto = {
                restaurant_id: 'rest-1',
                category_id: 'cat-1',
                name: 'New Pizza',
                price: 30.00,
            };

            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'insert').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({ data: mockProduct, error: null });

            const result = await service.create(createDto);

            expect(result).toEqual(mockProduct);
            expect(mockSupabase.insert).toHaveBeenCalledWith([createDto]);
        });

        it('should throw error when creation fails', async () => {
            const createDto = {
                restaurant_id: 'rest-1',
                category_id: 'cat-1',
                name: 'New Pizza',
                price: 30.00,
            };

            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'insert').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({
                data: null,
                error: { message: 'Constraint violation' },
            });

            await expect(service.create(createDto)).rejects.toThrow('Error al crear producto');
        });
    });

    describe('update', () => {
        it('should update an existing product', async () => {
            const updateDto = { name: 'Updated Pizza', price: 28.00 };

            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'update').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({
                data: { ...mockProduct, ...updateDto },
                error: null,
            });

            const result = await service.update('prod-1', updateDto);

            expect(result.name).toBe('Updated Pizza');
            expect(mockSupabase.update).toHaveBeenCalledWith(updateDto);
        });

        it('should throw NotFoundException when product to update not found', async () => {
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'update').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({ data: null, error: { message: 'Not found' } });

            await expect(service.update('invalid-id', { name: 'Test' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should soft delete a product by setting is_available to false', async () => {
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'update').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({
                data: { ...mockProduct, is_available: false },
                error: null,
            });

            const result = await service.remove('prod-1');

            expect(result.message).toBe('Producto eliminado exitosamente');
            expect(mockSupabase.update).toHaveBeenCalledWith({ is_available: false });
        });

        it('should throw NotFoundException when product to delete not found', async () => {
            jest.spyOn(mockSupabase, 'from').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'update').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'eq').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'select').mockReturnValue(mockSupabase);
            jest.spyOn(mockSupabase, 'single').mockResolvedValue({ data: null, error: { message: 'Not found' } });

            await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });
});
