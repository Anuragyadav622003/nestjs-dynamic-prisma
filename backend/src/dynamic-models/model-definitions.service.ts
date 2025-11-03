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

    // Check for existing model
    const existingModel = await this.prisma.modelDefinition.findFirst({
      where: {
        OR: [
          { name: createDto.name },
          { tableName: tableName }
        ]
      }
    });

    if (existingModel) {
      throw new ConflictException('Model with this name or table name already exists');
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

      this.logger.log(`✅ Model '${createDto.name}' created with table '${tableName}'`);
      return modelDef;
    } catch (error: any) {
      this.logger.error('Failed to create model definition:', error);
      throw new BadRequestException('Failed to create model definition');
    }
  }

  async findAll() {
    try {
      return await this.prisma.modelDefinition.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
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