import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../shared/prisma.service';
import { UserRole } from '../../shared/types';

@Injectable()
export class RBACGuard implements CanActivate {
  private readonly logger = new Logger(RBACGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    
    // If no permission is required, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin has all permissions
    if (user.role === UserRole.Admin) {
      return true;
    }

    const modelName = this.getModelNameFromRequest(request);
    if (!modelName) {
      throw new ForbiddenException('Model not specified');
    }

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
      throw new ForbiddenException(`Model '${modelName}' not found`);
    } 

    const rbacConfig = modelDef.rbac as any;
    const rolePermissions: string[] = rbacConfig[user.role] || [];
    
    const hasPermission = rolePermissions.includes('all') || 
                         rolePermissions.includes(requiredPermission);

    if (!hasPermission) {
      this.logger.warn(`User ${user.email} with role ${user.role} attempted ${requiredPermission} on ${modelName}`);
      throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermission}`);
    }

    // Ownership check for update/delete operations
    if (['update', 'delete'].includes(requiredPermission) && modelDef.ownerField) {
      const recordId = request.params.id;
      if (recordId) {
        const canModify = await this.checkOwnership(
          modelDef.tableName, 
          recordId, 
          user.id, 
          modelDef.ownerField
        );
        if (!canModify) {
          throw new ForbiddenException('Not authorized to modify this record');
        }
      }
    }

    return true;
  }

  private getModelNameFromRequest(request: any): string {
    return request.params.modelName;
  }

  private async checkOwnership(tableName: string, recordId: string, userId: string, ownerField: string): Promise<boolean> {
    try {
      // Validate inputs to prevent SQL injection
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ownerField)) {
        return false;
      }

      const result = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM "${tableName}" WHERE id = $1 AND "${ownerField}" = $2 LIMIT 1`,
        recordId,
        userId
      ) as any[];
      
      return result.length > 0;
    } catch (error) {
      this.logger.error('Ownership check failed:', error);
      return false;
    }
  }
}