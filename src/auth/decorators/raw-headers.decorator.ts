import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// export const RawHeaders = createParamDecorator(
//     ( data: string, ctx: ExecutionContext ) => {
//         const req = ctx.switchToHttp().getRequest();
//         return req.rawHeaders;
//     }
// );

export const getRawHeaders = (data: string, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.rawHeaders;
};

export const RawHeaders = createParamDecorator(getRawHeaders);