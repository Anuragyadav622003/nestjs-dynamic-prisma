// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DynamicModelsModule } from './dynamic-models/dynamic-models.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [AuthModule, DynamicModelsModule],
  controllers:[AppController],
  providers:[AppService]
})
export class AppModule {}