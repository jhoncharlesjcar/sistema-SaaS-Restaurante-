import { Expose } from 'class-transformer';

export class UserResponseDto {
    @Expose()
    id: string;

    @Expose()
    email: string;

    @Expose()
    full_name: string;

    @Expose()
    phone?: string;

    @Expose()
    role: string;

    @Expose()
    is_active: boolean;

    @Expose()
    restaurant_id: string;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;
}

export class RestaurantResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    ruc: string;

    @Expose()
    address?: string;

    @Expose()
    phone?: string;

    @Expose()
    email?: string;

    @Expose()
    timezone: string;

    @Expose()
    currency: string;

    @Expose()
    tax_rate: number;
}

export class AuthResponseDto {
    @Expose()
    access_token: string;

    @Expose()
    refresh_token: string;

    @Expose()
    expires_in: number;

    @Expose()
    token_type: string;

    @Expose()
    user: UserResponseDto;

    @Expose()
    restaurant?: RestaurantResponseDto;
}

export class MeResponseDto {
    @Expose()
    user: UserResponseDto;

    @Expose()
    restaurant?: RestaurantResponseDto;
}
