// backend/src/shared/decorators/permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Permission = (permission: string) => SetMetadata('permission', permission);