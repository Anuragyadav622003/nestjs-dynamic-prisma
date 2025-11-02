// backend/src/shared/guards/rbac.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'Admin') {
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
      throw new ForbiddenException('Model not found');
    } 

    const permissions = (modelDef.rbac as any)[user.role] || [];
    const hasPermission = permissions.includes('all') || permissions.includes(requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (['update', 'delete'].includes(requiredPermission) && modelDef.ownerField) {
      const recordId = request.params.id;
      if (recordId) {
        const canModify = await this.checkOwnership(modelDef.tableName, recordId, user.id, modelDef.ownerField);
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
      const result = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM "${tableName}" WHERE id = $1 AND "${ownerField}" = $2 LIMIT 1`,
        recordId,
        userId
      ) as any[];
      
      return result.length > 0;
    } catch (error) {
      console.error('Ownership check failed:', error);
      return false;
    }
  }
}