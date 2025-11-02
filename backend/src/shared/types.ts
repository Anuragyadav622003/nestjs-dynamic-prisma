// backend/src/shared/types.ts
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'text';

export interface ModelField {
  name: string;
  type: FieldType;
  required: boolean;
  default?: any;
  unique?: boolean;
  relation?: {
    model: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one';
  };
}

export interface RBACConfig {
  [role: string]: ('create' | 'read' | 'update' | 'delete' | 'all')[];
}

export interface ModelDefinition {
  id: string;
  name: string;
  tableName: string;
  fields: ModelField[];
  ownerField?: string;
  rbac: RBACConfig;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Viewer';
  createdAt: Date;
  updatedAt: Date;
}

export type Permission = 'create' | 'read' | 'update' | 'delete';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}