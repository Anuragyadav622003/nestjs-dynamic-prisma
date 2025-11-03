import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class DynamicCrudService {
  private readonly logger = new Logger(DynamicCrudService.name);

  constructor(private prisma: PrismaService) {}

  async create(tableName: string, data: any) {
    this.validateTableName(tableName);
    
    const id = this.generateId();
    const now = new Date();

    const columns = ['id', 'createdAt', 'updatedAt', ...Object.keys(data)];
    const placeholders = ['$1', '$2::timestamp', '$3::timestamp', ...Object.keys(data).map((_, i) => `$${i + 4}`)];
    const values = [id, now, now, ...Object.values(data)];

    // Validate and sanitize column names
    columns.forEach(col => this.validateColumnName(col));

    const columnNames = columns.map(col => `"${col}"`).join(', ');

    const sql = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    try {
      const result = await this.prisma.$queryRawUnsafe(sql, ...values);
      this.logger.log(`Created record in ${tableName} with ID: ${id}`);
      return (result as any[])[0];
    } catch (error: any) {
      this.logger.error(`Failed to create record in ${tableName}:`, error);
      throw new BadRequestException(`Failed to create record: ${error.message}`);
    }
  }

  async findAll(tableName: string, filters: any = {}) {
    this.validateTableName(tableName);
    
    let whereClause = '';
    const values: any[] = [];
    let paramCount = 1;
    
    if (Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key) => {
        this.validateColumnName(key);
        values.push(filters[key]);
        const condition = `"${key}" = $${paramCount}`;
        paramCount++;
        return condition;
      });
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const sql = `SELECT * FROM "${tableName}" ${whereClause} ORDER BY "createdAt" DESC`;
    
    try {
      const results = await this.prisma.$queryRawUnsafe(sql, ...values);
      this.logger.log(`Fetched ${(results as any[]).length} records from ${tableName}`);
      return results;
    } catch (error: any) {
      this.logger.error(`Failed to fetch records from ${tableName}:`, error);
      throw new BadRequestException(`Failed to fetch records: ${error.message}`);
    }
  }

  async findById(tableName: string, id: string) {
    this.validateTableName(tableName);
    
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const sql = `SELECT * FROM "${tableName}" WHERE "id" = $1 LIMIT 1`;
    
    try {
      const results = await this.prisma.$queryRawUnsafe(sql, id) as any[];
      
      if (results.length === 0) {
        throw new NotFoundException('Record not found');
      }
      
      this.logger.log(`Fetched record ${id} from ${tableName}`);
      return results[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch record ${id} from ${tableName}:`, error);
      throw new BadRequestException(`Failed to fetch record: ${error.message}`);
    }
  }

  async update(tableName: string, id: string, data: any) {
    this.validateTableName(tableName);
    
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const now = new Date();
    const setClauses: string[] = ['"updatedAt" = $1::timestamp'];
    const values: any[] = [now];

    let paramCount = 2;
    Object.keys(data).forEach(key => {
      this.validateColumnName(key);
      setClauses.push(`"${key}" = $${paramCount}`);
      values.push(data[key]);
      paramCount++;
    });

    values.push(id);

    const sql = `UPDATE "${tableName}" 
                 SET ${setClauses.join(', ')} 
                 WHERE "id" = $${paramCount} 
                 RETURNING *`;

    try {
      const result = await this.prisma.$queryRawUnsafe(sql, ...values);
      const results = result as any[];
      if (results.length === 0) {
        throw new NotFoundException('Record not found');
      }
      this.logger.log(`Updated record ${id} in ${tableName}`);
      return results[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update record ${id} in ${tableName}:`, error);
      throw new BadRequestException(`Failed to update record: ${error.message}`);
    }
  }

  async delete(tableName: string, id: string) {
    this.validateTableName(tableName);
    
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const sql = `DELETE FROM "${tableName}" WHERE "id" = $1 RETURNING *`;
    
    try {
      const result = await this.prisma.$queryRawUnsafe(sql, id);
      const results = result as any[];
      if (results.length === 0) {
        throw new NotFoundException('Record not found');
      }
      this.logger.log(`Deleted record ${id} from ${tableName}`);
      return { message: 'Record deleted successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete record ${id} from ${tableName}:`, error);
      throw new BadRequestException(`Failed to delete record: ${error.message}`);
    }
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private validateTableName(tableName: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new BadRequestException(`Invalid table name: ${tableName}`);
    }
  }

  private validateColumnName(columnName: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnName)) {
      throw new BadRequestException(`Invalid column name: ${columnName}`);
    }
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}