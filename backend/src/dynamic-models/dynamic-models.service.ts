// backend/src/dynamic-models/dynamic-models.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DynamicCrudService } from './dynamic-crud.service';
import { ModelDefinitionsService } from './model-definitions.service';

@Injectable()
export class DynamicModelsService {
  constructor(
    private prisma: PrismaService,
    private dynamicCrud: DynamicCrudService,
    private modelDefinitions: ModelDefinitionsService,
  ) {}

  async createRecord(modelName: string, data: any, userId?: string) {
    const modelDef = await this.getModelDefinition(modelName);
    
    if (modelDef.ownerField && userId) {
      data[modelDef.ownerField] = userId;
    }

    return this.dynamicCrud.create(modelDef.tableName, data);
  }

  async findAllRecords(modelName: string, filters: any = {}) {
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.findAll(modelDef.tableName, filters);
  }

  async findRecordById(modelName: string, id: string) {
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.findById(modelDef.tableName, id);
  }

  async updateRecord(modelName: string, id: string, data: any) {
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.update(modelDef.tableName, id, data);
  }

  async deleteRecord(modelName: string, id: string) {
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.delete(modelDef.tableName, id);
  }

  private async getModelDefinition(modelName: string) {
    const modelDef = await this.prisma.modelDefinition.findFirst({
      where: { 
        OR: [
          { name: modelName },
          { tableName: modelName }
        ],
        isActive: true 
      },
    });

    if (!modelDef) {
      throw new NotFoundException(`Model '${modelName}' not found`);
    }

    return modelDef;
  }
}