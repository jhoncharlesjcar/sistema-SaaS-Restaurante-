import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
    id: string;
    email: string;
    role: string;
    restaurant_id: string;
    full_name: string;
}

export const CurrentUser = createParamDecorator(
    (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as CurrentUserData;

        if (!user) {
            return null;
        }

        return data ? user[data] : user;
    },
);
