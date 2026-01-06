import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
    @IsUUID()
    @IsNotEmpty()
    restaurant_id: string;

    @IsUUID()
    @IsOptional()
    category_id?: string;

    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsString()
    @IsOptional()
    image_url?: string;

    @IsNumber()
    @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
    price: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    cost?: number;

    @IsBoolean()
    @IsOptional()
    is_available?: boolean;

    @IsBoolean()
    @IsOptional()
    track_inventory?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    stock_quantity?: number;

    @IsBoolean()
    @IsOptional()
    is_taxable?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    preparation_time?: number;
}
