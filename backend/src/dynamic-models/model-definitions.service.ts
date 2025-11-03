import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateModelDefinitionDto } from './dto/create-model-definition.dto';

@Injectable()
export class ModelDefinitionsService {
  private readonly logger = new Logger(ModelDefinitionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateModelDefinitionDto) {
    const tableName = createDto.tableName || `${createDto.name.toLowerCase()}s`;
    
    // Validate model name and table name
    this.validateModelName(createDto.name);
    this.validateTableName(tableName);

    // Check for table name uniqueness (table names must be globally unique)
    const existingTableModel = await this.prisma.modelDefinition.findFirst({
      where: {
        tableName: tableName,
        isActive: true
      }
    });

    if (existingTableModel) {
      throw new ConflictException(
        `Table name '${tableName}' is already used by model '${existingTableModel.name}'. ` +
        `Please choose a different table name.`
      );
    }

    // Check for same model name (allow but inform user)
    const sameNameModels = await this.prisma.modelDefinition.findMany({
      where: {
        name: createDto.name,
        isActive: true
      },
      select: {
        tableName: true,
        createdAt: true
      }
    });

    let warningMessage = '';
    if (sameNameModels.length > 0) {
      const existingTables = sameNameModels.map(m => m.tableName).join(', ');
      warningMessage = `Note: Model name '${createDto.name}' already exists with tables: ${existingTables}. This is allowed for versioning or multi-tenant scenarios.`;
      this.logger.warn(warningMessage);
    }

    // Validate fields
    this.validateFields(createDto.fields);

    try {
      const modelDef = await this.prisma.modelDefinition.create({
        data: {
          name: createDto.name,
          tableName,
          fields: createDto.fields as any,
          ownerField: createDto.ownerField,
          rbac: createDto.rbac as any,
        },
      });

      await this.createDynamicTable(tableName, createDto.fields);

      const response: any = {
        message: 'Model created successfully',
        model: {
          id: modelDef.id,
          name: modelDef.name,
          tableName: modelDef.tableName,
          fields: modelDef.fields,
          ownerField: modelDef.ownerField,
          rbac: modelDef.rbac,
          createdAt: modelDef.createdAt,
          isActive: modelDef.isActive
        }
      };

      if (warningMessage) {
        response.warning = warningMessage;
      }

      this.logger.log(`✅ Model '${createDto.name}' created with table '${tableName}'`);
      return response;
      
    } catch (error: any) {
      this.logger.error('Failed to create model definition:', error);
      throw new BadRequestException('Failed to create model definition');
    }
  }

  async findAll() {
    try {
      const models = await this.prisma.modelDefinition.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      // Group models by name for better visualization
      const groupedModels = models.reduce((acc, model) => {
        if (!acc[model.name]) {
          acc[model.name] = [];
        }
        acc[model.name].push({
          id: model.id,
          tableName: model.tableName,
          fields: model.fields,
          ownerField: model.ownerField,
          rbac: model.rbac,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt
        });
        return acc;
      }, {});

      return {
        models,
        groupedByModelName: groupedModels,
        total: models.length,
        uniqueModelNames: Object.keys(groupedModels).length
      };
    } catch (error: any) {
      this.logger.error('Failed to fetch model definitions:', error);
      throw new BadRequestException('Failed to fetch model definitions');
    }
  }

  async findOne(id: string) {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    try {
      const modelDef = await this.prisma.modelDefinition.findUnique({
        where: { id },
      });

      if (!modelDef) {
        throw new NotFoundException('Model definition not found');
      }

      return modelDef;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch model definition ${id}:`, error);
      throw new BadRequestException('Failed to fetch model definition');
    }
  }

  async findByName(modelName: string) {
    try {
      const models = await this.prisma.modelDefinition.findMany({
        where: { 
          name: modelName,
          isActive: true 
        },
        orderBy: { createdAt: 'desc' },
      });

      if (models.length === 0) {
        throw new NotFoundException(`No models found with name '${modelName}'`);
      }

      return {
        modelName,
        instances: models,
        totalInstances: models.length,
        tables: models.map(m => m.tableName)
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch models by name '${modelName}':`, error);
      throw new BadRequestException('Failed to fetch models');
    }
  }

  async remove(id: string) {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    try {
      const modelDef = await this.prisma.modelDefinition.findUnique({
        where: { id },
      });

      if (!modelDef) {
        throw new NotFoundException('Model definition not found');
      }

      return await this.prisma.modelDefinition.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete model definition ${id}:`, error);
      throw new BadRequestException('Failed to delete model definition');
    }
  }

  async removeByNameAndTable(modelName: string, tableName: string) {
    try {
      const modelDef = await this.prisma.modelDefinition.findFirst({
        where: { 
          name: modelName,
          tableName: tableName,
          isActive: true 
        },
      });

      if (!modelDef) {
        throw new NotFoundException(`Model '${modelName}' with table '${tableName}' not found`);
      }

      return await this.prisma.modelDefinition.update({
        where: { id: modelDef.id },
        data: { isActive: false },
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete model '${modelName}' with table '${tableName}':`, error);
      throw new BadRequestException('Failed to delete model definition');
    }
  }

  private async createDynamicTable(tableName: string, fields: any[]) {
    try {
      this.logger.log(`📦 Creating dynamic table: ${tableName}`);
      
      // Build simple field definitions without complex defaults
      const fieldDefinitions = fields.map(field => {
        const typeMap: { [key: string]: string } = {
          'string': 'TEXT',
          'text': 'TEXT', 
          'number': 'DOUBLE PRECISION',
          'boolean': 'BOOLEAN',
          'date': 'TIMESTAMP'
        };
        
        const sqlType = typeMap[field.type] || 'TEXT';
        const constraints = field.required ? 'NOT NULL' : '';
        
        return `"${field.name}" ${sqlType} ${constraints}`.trim();
      });

      // Simple CREATE TABLE statement
      const sql = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          "id" TEXT PRIMARY KEY,
          ${fieldDefinitions.join(',\n')},
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.logger.log(`⚡ Executing table creation...`);
      
      // Execute the SQL
      await this.prisma.$executeRawUnsafe(sql);
      
      // Verify table was created
      const verificationSuccess = await this.verifyTableCreation(tableName);
      
      if (verificationSuccess) {
        this.logger.log(`✨ SUCCESS: Table '${tableName}' created and verified!`);
        return true;
      } else {
        throw new Error(`Table creation verification failed for '${tableName}'`);
      }
      
    } catch (error: any) {
      this.logger.error(`💥 Failed to create table '${tableName}':`, error.message);
      throw new BadRequestException(`Failed to create dynamic table: ${error.message}`);
    }
  }

  private async verifyTableCreation(tableName: string): Promise<boolean> {
    try {
      // Wait a moment for table creation to complete
      await this.delay(300);
      
      // Method 1: Try to query information_schema (Prisma compatible)
      const verifySql = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = '${tableName}' 
        AND table_schema = 'public';
      `;
      
      const result = await this.prisma.$queryRawUnsafe(verifySql) as any[];
      
      if (result.length > 0) {
        this.logger.log(`🔍 Verification: Table '${tableName}' found in information_schema`);
        return true;
      }
      
      // Method 2: Try a simple test insert
      try {
        const testId = 'verify-' + Date.now();
        const insertSql = `
          INSERT INTO "${tableName}" ("id", "createdAt", "updatedAt") 
          VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        await this.prisma.$executeRawUnsafe(insertSql, testId);
        this.logger.log(`🔍 Verification: Test record inserted into '${tableName}'`);
        
        // Clean up
        const deleteSql = `DELETE FROM "${tableName}" WHERE "id" = $1`;
        await this.prisma.$executeRawUnsafe(deleteSql, testId);
        this.logger.log(`🔍 Verification: Test record cleaned up from '${tableName}'`);
        
        return true;
        
      } catch (insertError: any) {
        // If we can't insert, check the error type
        if (insertError.message?.includes('does not exist')) {
          this.logger.error(`🔍 Verification FAILED: Table '${tableName}' does not exist`);
          return false;
        } else {
          // Table exists but might have different structure - still consider it a success
          this.logger.warn(`🔍 Verification: Table '${tableName}' exists but test insert failed: ${insertError.message}`);
          return true;
        }
      }
      
    } catch (error: any) {
      this.logger.error(`🔍 Verification failed for '${tableName}':`, error.message);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateModelName(name: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new BadRequestException(`Invalid model name: ${name}`);
    }
  }

  private validateTableName(tableName: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new BadRequestException(`Invalid table name: ${tableName}`);
    }
  }

  private validateFields(fields: any[]): void {
    if (!fields || fields.length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    const fieldNames = new Set<string>();
    for (const field of fields) {
      if (!field.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
        throw new BadRequestException(`Invalid field name: ${field.name}`);
      }

      if (fieldNames.has(field.name)) {
        throw new BadRequestException(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);

      if (!['string', 'number', 'boolean', 'date', 'text'].includes(field.type)) {
        throw new BadRequestException(`Invalid field type for ${field.name}: ${field.type}`);
      }
    }
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}