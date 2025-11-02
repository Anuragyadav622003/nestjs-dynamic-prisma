// backend/src/dynamic-models/dynamic-models.module.ts
import { Module } from '@nestjs/common';
import { DynamicModelsService } from './dynamic-models.service';
import { DynamicModelsController } from './dynamic-models.controller';
import { ModelDefinitionsService } from './model-definitions.service';
import { ModelDefinitionsController } from './model-definitions.controller';
import { DynamicCrudService } from './dynamic-crud.service';
import { PrismaService } from '../shared/prisma.service';
import { RBACGuard } from '../shared/guards/rbac.guard';

@Module({
  providers: [
    DynamicModelsService, 
    ModelDefinitionsService, 
    DynamicCrudService, 
    PrismaService,
    RBACGuard,
  ],
  controllers: [DynamicModelsController, ModelDefinitionsController],
  exports: [DynamicModelsService, ModelDefinitionsService],
})
export class DynamicModelsModule {}