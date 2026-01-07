import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional, validateSync, IsUrl, Min, Max } from 'class-validator';

export class EnvironmentVariables {
    // Supabase Configuration
    @IsString()
    @IsNotEmpty({ message: 'SUPABASE_URL es requerido' })
    @IsUrl({}, { message: 'SUPABASE_URL debe ser una URL válida' })
    SUPABASE_URL: string;

    @IsString()
    @IsNotEmpty({ message: 'SUPABASE_ANON_KEY es requerido' })
    SUPABASE_ANON_KEY: string;

    @IsString()
    @IsNotEmpty({ message: 'SUPABASE_SERVICE_ROLE_KEY es requerido' })
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Server Configuration
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(65535)
    PORT?: number = 3000;

    @IsString()
    @IsOptional()
    CORS_ORIGIN?: string = 'http://localhost:5173';

    // Optional JWT Configuration
    @IsString()
    @IsOptional()
    JWT_SECRET?: string;

    @IsNumber()
    @IsOptional()
    JWT_EXPIRES_IN?: number;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
            const constraints = error.constraints ? Object.values(error.constraints) : [];
            return `${error.property}: ${constraints.join(', ')}`;
        });

        throw new Error(`\n❌ Environment validation failed:\n${errorMessages.join('\n')}\n`);
    }

    return validatedConfig;
}
