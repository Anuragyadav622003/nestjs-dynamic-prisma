// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DynamicModelsModule } from './dynamic-models/dynamic-models.module';

@Module({
  imports: [AuthModule, DynamicModelsModule],
})
export class AppModule {}