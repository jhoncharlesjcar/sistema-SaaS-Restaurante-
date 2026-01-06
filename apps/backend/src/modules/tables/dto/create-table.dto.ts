import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';

export class CreateTableDto {
    @IsUUID()
    @IsNotEmpty()
    restaurant_id: string;

    @IsString()
    @IsNotEmpty({ message: 'El número de mesa es requerido' })
    table_number: string;

    @IsString()
    @IsOptional()
    table_name?: string;

    @IsNumber()
    @Min(1, { message: 'La capacidad debe ser al menos 1' })
    capacity: number;

    @IsString()
    @IsOptional()
    location?: string;

    @IsEnum(['available', 'occupied', 'reserved', 'maintenance'])
    @IsOptional()
    status?: string;
}
