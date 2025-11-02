// backend/src/dynamic-models/dynamic-crud.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class DynamicCrudService {
  constructor(private prisma: PrismaService) {}

  async create(tableName: string, data: any) {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const columns = ['id', 'createdAt', 'updatedAt', ...Object.keys(data)];
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const values = [id, now, now, ...Object.values(data)];

    const columnNames = columns.map(col => `"${col}"`).join(', ');
    
    const sql = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders}) RETURNING *`;
    
    try {
      const result = await this.prisma.$queryRawUnsafe(sql, ...values);
      return (result as any[])[0];
    } catch (error) {
      throw new Error(`Failed to create record: ${error.message}`);
    }
  }

  async findAll(tableName: string, filters: any = {}) {
    let whereClause = '';
    const values: any[] = [];
    let paramCount = 1;
    
    if (Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key) => {
        values.push(filters[key]);
        const condition = `"${key}" = $${paramCount}`;
        paramCount++;
        return condition;
      });
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const sql = `SELECT * FROM "${tableName}" ${whereClause} ORDER BY "createdAt" DESC`;
    
    try {
      return await this.prisma.$queryRawUnsafe(sql, ...values);
    } catch (error) {
      throw new Error(`Failed to fetch records: ${error.message}`);
    }
  }

  async findById(tableName: string, id: string) {
    const sql = `SELECT * FROM "${tableName}" WHERE "id" = $1 LIMIT 1`;
    
    try {
      const results = await this.prisma.$queryRawUnsafe(sql, id) as any[];
      
      if (results.length === 0) {
        throw new NotFoundException('Record not found');
      }
      
      return results[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to fetch record: ${error.message}`);
    }
  }

  async update(tableName: string, id: string, data: any) {
    const now = new Date().toISOString();
    const setClauses: string[] = ['"updatedAt" = $1'];
    const values: any[] = [now];

    let paramCount = 2;
    Object.keys(data).forEach(key => {
      setClauses.push(`"${key}" = $${paramCount}`);
      values.push(data[key]);
      paramCount++;
    });

    values.push(id);

    const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE "id" = $${paramCount} RETURNING *`;
    
    try {
      const result = await this.prisma.$queryRawUnsafe(sql, ...values);
      const results = result as any[];
      if (results.length === 0) {
        throw new NotFoundException('Record not found');
      }
      return results[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to update record: ${error.message}`);
    }
  }

  async delete(tableName: string, id: string) {
    const sql = `DELETE FROM "${tableName}" WHERE "id" = $1 RETURNING *`;
    
    try {
      const result = await this.prisma.$queryRawUnsafe(sql, id);
      const results = result as any[];
      if (results.length === 0) {
        throw new NotFoundException('Record not found');
      }
      return { message: 'Record deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}