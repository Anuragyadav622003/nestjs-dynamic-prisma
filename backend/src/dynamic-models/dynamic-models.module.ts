import { Module } from '@nestjs/common';
import { DynamicModelsController } from './dynamic-models.controller';
import { DynamicModelsService } from './dynamic-models.service';
import { ModelDefinitionsController } from './model-definitions.controller';
import { ModelDefinitionsService } from './model-definitions.service';
import { DynamicCrudService } from './dynamic-crud.service';
import { PrismaService } from '../shared/prisma.service';

@Module({
  controllers: [DynamicModelsController, ModelDefinitionsController],
  providers: [
    DynamicModelsService,
    ModelDefinitionsService,
    DynamicCrudService,
    PrismaService,
  ],
  exports: [DynamicModelsService],
})
export class DynamicModelsModule {}