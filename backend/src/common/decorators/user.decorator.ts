import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  userId: string;
  role: string;
}

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
