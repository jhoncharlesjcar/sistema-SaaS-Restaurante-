import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../../supabase/supabase.module';

describe('ProductsService', () => {
    let service: ProductsService;
    let mockSupabase: any;

    const mockProduct = {
        id: 'product-123',
        restaurant_id: 'restaurant-123',
        category_id: 'category-1',
        name: 'Pizza Margherita',
        description: 'Classic pizza',
        price: 45.00,
        is_available: true,
        is_taxable: true,
        track_inventory: false,
        stock_quantity: 0,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockCategory = {
        id: 'category-1',
        name: 'Pizzas',
        color: '#FF5733',
    };

    beforeEach(async () => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            single: jest.fn(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
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

    describe('findAll', () => {
        it('should return all products for a restaurant', async () => {
            const mockProducts = [mockProduct];

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockProducts,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.findAll('restaurant-123');

            expect(result).toEqual(mockProducts);
            expect(mockSupabase.from).toHaveBeenCalledWith('products');
        });

        it('should filter by category when provided', async () => {
            const categoryProducts = [mockProduct];

            // Simplified mock for category filtering
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: categoryProducts,
                                error: null,
                            }),
                        }),
                        order: jest.fn().mockResolvedValue({
                            data: categoryProducts,
                            error: null,
                        }),
                    }),
                }),
            });

            await expect(service.findAll('restaurant-123', 'category-1')).resolves.toBeDefined();
        });
    });

    describe('findOne', () => {
        it('should return a single product', async () => {
            const productWithCategory = {
                ...mockProduct,
                categories: mockCategory,
            };

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: productWithCategory,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.findOne('product-123');

            expect(result).toEqual(productWithCategory);
        });

        it('should throw NotFoundException when product not found', async () => {
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Not found' },
                        }),
                    }),
                }),
            });

            await expect(service.findOne('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('should create a new product', async () => {
            const createDto = {
                restaurant_id: 'restaurant-123',
                category_id: 'category-1',
                name: 'New Pizza',
                price: 50.00,
            };

            mockSupabase.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { ...mockProduct, ...createDto },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(result.name).toBe('New Pizza');
        });

        it('should throw error when creation fails', async () => {
            mockSupabase.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Database error' },
                        }),
                    }),
                }),
            });

            await expect(
                service.create({
                    restaurant_id: 'restaurant-123',
                    name: 'Test',
                    price: 10,
                }),
            ).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('should update a product', async () => {
            const updateDto = {
                name: 'Updated Pizza',
                price: 55.00,
            };

            mockSupabase.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { ...mockProduct, ...updateDto },
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await service.update('product-123', updateDto);

            expect(result.name).toBe('Updated Pizza');
            expect(result.price).toBe(55.00);
        });
    });

    describe('remove', () => {
        it('should delete a product', async () => {
            mockSupabase.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockProduct,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await service.remove('product-123');

            expect(result.message).toContain('eliminado');
        });

        it('should throw NotFoundException when product not found', async () => {
            mockSupabase.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Not found' },
                            }),
                        }),
                    }),
                }),
            });

            await expect(service.remove('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
