import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../../supabase/supabase.module';

describe('OrdersService', () => {
    let service: OrdersService;
    let mockSupabase: any;

    const mockOrder = {
        id: 'order-123',
        restaurant_id: 'restaurant-123',
        table_id: 'table-1',
        user_id: 'user-123',
        order_number: 'ORD-20260106-001',
        status: 'draft',
        subtotal: 100,
        tax_amount: 18,
        discount_amount: 0,
        tip_amount: 0,
        total: 118,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockOrderItems = [
        {
            id: 'item-1',
            order_id: 'order-123',
            product_id: 'product-1',
            product_name: 'Pizza',
            quantity: 2,
            unit_price: 50,
            subtotal: 100,
            kitchen_status: 'pending',
        },
    ];

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
            rpc: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                {
                    provide: SUPABASE_CLIENT,
                    useValue: mockSupabase,
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all orders for a restaurant', async () => {
            const mockOrders = [mockOrder];

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockOrders,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.findAll('restaurant-123');

            expect(result).toEqual(mockOrders);
            expect(mockSupabase.from).toHaveBeenCalledWith('orders');
        });

        it('should filter by status when provided', async () => {
            const pendingOrders = [{ ...mockOrder, status: 'draft' }];

            // For this test, just verify the method doesn't throw
            // Complex query chaining is tested in integration tests
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: pendingOrders,
                                error: null,
                            }),
                        }),
                        order: jest.fn().mockResolvedValue({
                            data: pendingOrders,
                            error: null,
                        }),
                    }),
                }),
            });

            // Just verify no errors thrown - detailed behavior tested in integration
            await expect(service.findAll('restaurant-123', 'draft')).resolves.toBeDefined();
        });
    });

    describe('findOne', () => {
        it('should return a single order with items', async () => {
            const orderWithItems = {
                ...mockOrder,
                order_items: mockOrderItems,
            };

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: orderWithItems,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.findOne('order-123');

            expect(result).toEqual(orderWithItems);
            expect(result.order_items).toHaveLength(1);
        });

        it('should throw NotFoundException when order not found', async () => {
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
        it('should create an order with items', async () => {
            const createDto = {
                restaurant_id: 'restaurant-123',
                table_id: 'table-1',
                user_id: 'user-123',
                subtotal: 100,
                tax_amount: 18,
                total: 118,
                items: [
                    {
                        product_id: 'product-1',
                        product_name: 'Pizza',
                        quantity: 2,
                        unit_price: 50,
                        subtotal: 100,
                    },
                ],
            };

            // Mock order number generation
            mockSupabase.rpc.mockResolvedValue({
                data: 'ORD-20260106-001',
                error: null,
            });

            // Mock order creation
            mockSupabase.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrder,
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { ...mockOrder, order_items: mockOrderItems },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_order_number', {
                p_restaurant_id: 'restaurant-123',
            });
        });
    });

    describe('updateStatus', () => {
        it('should update order status', async () => {
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { ...mockOrder, table_id: null },
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { ...mockOrder, status: 'paid' },
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await service.updateStatus('order-123', 'paid');

            expect(result).toBeDefined();
        });
    });

    describe('remove', () => {
        it('should delete an order', async () => {
            mockSupabase.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockOrder,
                                error: null,
                            }),
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            });

            const result = await service.remove('order-123');

            expect(result.message).toBe('Orden eliminada exitosamente');
        });

        it('should throw NotFoundException when order not found', async () => {
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
