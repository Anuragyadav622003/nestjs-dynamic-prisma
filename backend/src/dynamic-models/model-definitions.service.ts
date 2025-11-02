// backend/src/dynamic-models/model-definitions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateModelDefinitionDto } from './dto/create-model-definition.dto';

@Injectable()
export class ModelDefinitionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateModelDefinitionDto) {
    const tableName = createDto.tableName || `${createDto.name.toLowerCase()}s`;
    
    const existingModel = await this.prisma.modelDefinition.findFirst({
      where: {
        OR: [
          { name: createDto.name },
          { tableName: tableName }
        ]
      }
    });

    if (existingModel) {
      throw new Error('Model with this name or table name already exists');
    }

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

    console.log(`✅ Model '${createDto.name}' created with table '${tableName}'`);
    return modelDef;
  }

  async findAll() {
    return this.prisma.modelDefinition.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const modelDef = await this.prisma.modelDefinition.findUnique({
      where: { id },
    });

    if (!modelDef) {
      throw new NotFoundException('Model definition not found');
    }

    return modelDef;
  }

  async remove(id: string) {
    const modelDef = await this.prisma.modelDefinition.findUnique({
      where: { id },
    });

    if (!modelDef) {
      throw new NotFoundException('Model definition not found');
    }

    return this.prisma.modelDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async createDynamicTable(tableName: string, fields: any[]) {
    try {
      const fieldDefinitions = fields.map(field => {
        let sqlType = 'TEXT';
        switch (field.type) {
          case 'number':
            sqlType = 'DOUBLE PRECISION';
            break;
          case 'boolean':
            sqlType = 'BOOLEAN';
            break;
          case 'date':
            sqlType = 'TIMESTAMP';
            break;
          default:
            sqlType = 'TEXT';
        }
        
        const constraints: string[] = [];
        if (field.required) constraints.push('NOT NULL');
        if (field.unique) constraints.push('UNIQUE');
        if (field.default !== undefined) {
          constraints.push(`DEFAULT ${this.formatDefaultValue(field.default, field.type)}`);
        }
        
        return `"${field.name}" ${sqlType} ${constraints.join(' ')}`.trim();
      });

      const sql = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          ${fieldDefinitions.join(',\n')},
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await this.prisma.$executeRawUnsafe(sql);
      console.log(`✅ Table '${tableName}' created successfully`);
    } catch (error) {
      console.error('❌ Failed to create dynamic table:', error);
      throw new Error(`Failed to create dynamic table: ${error.message}`);
    }
  }

  private formatDefaultValue(value: any, type: string): string {
    switch (type) {
      case 'string':
      case 'text':
        return `'${value}'`;
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return value.toString();
    }
  }
}