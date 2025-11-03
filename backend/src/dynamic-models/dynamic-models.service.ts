import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DynamicCrudService } from './dynamic-crud.service';
import { ModelDefinitionsService } from './model-definitions.service';

@Injectable()
export class DynamicModelsService {
  private readonly logger = new Logger(DynamicModelsService.name);

  constructor(
    private prisma: PrismaService,
    private dynamicCrud: DynamicCrudService,
    private modelDefinitions: ModelDefinitionsService,
  ) {}

  async createRecord(modelName: string, data: any, userId?: string) {
    this.validateModelName(modelName);
    
    const modelDef = await this.getModelDefinition(modelName);
    
    // Validate required fields
    this.validateRequiredFields(modelDef.fields as any[], data);
    
    if (modelDef.ownerField && userId) {
      data[modelDef.ownerField] = userId;
    }

    return this.dynamicCrud.create(modelDef.tableName, data);
  }

  async findAllRecords(modelName: string, filters: any = {}) {
    this.validateModelName(modelName);
    
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.findAll(modelDef.tableName, filters);
  }

  async findRecordById(modelName: string, id: string) {
    this.validateModelName(modelName);
    
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.findById(modelDef.tableName, id);
  }

  async updateRecord(modelName: string, id: string, data: any) {
    this.validateModelName(modelName);
    
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.update(modelDef.tableName, id, data);
  }

  async deleteRecord(modelName: string, id: string) {
    this.validateModelName(modelName);
    
    const modelDef = await this.getModelDefinition(modelName);
    return this.dynamicCrud.delete(modelDef.tableName, id);
  }

  private async getModelDefinition(modelName: string) {
    try {
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
        throw new NotFoundException(`Model '${modelName}' not found or inactive`);
      }

      return modelDef;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get model definition for ${modelName}:`, error);
      throw new BadRequestException('Failed to get model definition');
    }
  }

  private validateModelName(modelName: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(modelName)) {
      throw new BadRequestException(`Invalid model name: ${modelName}`);
    }
  }

  private validateRequiredFields(fields: any[], data: any): void {
    const requiredFields = fields.filter(field => field.required && !field.default);
    
    for (const field of requiredFields) {
      if (data[field.name] === undefined || data[field.name] === null || data[field.name] === '') {
        throw new BadRequestException(`Required field '${field.name}' is missing`);
      }
    }
  }
}