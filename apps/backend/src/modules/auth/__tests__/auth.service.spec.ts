import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../../supabase/supabase.module';

describe('AuthService', () => {
    let service: AuthService;
    let mockSupabase: any;
    let mockConfigService: any;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
    };

    const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin',
        restaurant_id: 'restaurant-123',
        is_active: true,
    };

    const mockRestaurant = {
        id: 'restaurant-123',
        name: 'Test Restaurant',
        ruc: '12345678901',
        timezone: 'America/Lima',
        currency: 'PEN',
        tax_rate: 0.18,
    };

    beforeEach(async () => {
        mockSupabase = {
            auth: {
                signInWithPassword: jest.fn(),
                signOut: jest.fn(),
                getUser: jest.fn(),
                refreshSession: jest.fn(),
            },
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
        };

        mockConfigService = {
            get: jest.fn().mockReturnValue('test-value'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: SUPABASE_CLIENT,
                    useValue: mockSupabase,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const mockSession = {
                access_token: 'access-token-123',
                refresh_token: 'refresh-token-123',
                expires_in: 3600,
            };

            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

            // Mock the chain for user profile query
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockUserProfile,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('user');
            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid credentials' },
            });

            await expect(
                service.login({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should successfully logout', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({ error: null });

            const result = await service.logout('valid-token');

            expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
        });
    });

    describe('getCurrentUser', () => {
        it('should return user profile for valid token', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            // Mock the chain for user profile query
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { ...mockUserProfile, restaurants: mockRestaurant },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await service.getCurrentUser('valid-token');

            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('email', 'test@example.com');
        });

        it('should throw UnauthorizedException for invalid token', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid token' },
            });

            await expect(service.getCurrentUser('invalid-token')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            const newSession = {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                expires_in: 3600,
            };

            mockSupabase.auth.refreshSession.mockResolvedValue({
                data: { session: newSession },
                error: null,
            });

            const result = await service.refreshToken('old-refresh-token');

            expect(result).toHaveProperty('access_token');
            expect(result.access_token).toBe('new-access-token');
        });

        it('should throw error for invalid refresh token', async () => {
            mockSupabase.auth.refreshSession.mockResolvedValue({
                data: { session: null },
                error: { message: 'Invalid refresh token' },
            });

            await expect(service.refreshToken('invalid-token')).rejects.toThrow();
        });
    });
});
