// backend/src/dynamic-models/dto/create-model-definition.dto.ts
import { IsString, IsArray, IsObject, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ModelFieldDto {
  @IsString()
  name: string;

  @IsString()
  type: 'string' | 'number' | 'boolean' | 'date' | 'text';

  @IsBoolean()
  required: boolean;

  @IsOptional()
  default?: any;

  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @IsOptional()
  @IsObject()
  relation?: {
    model: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one';
  };
}

export class CreateModelDefinitionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  tableName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModelFieldDto)
  fields: ModelFieldDto[];

  @IsString()
  @IsOptional()
  ownerField?: string;

  @IsObject()
  rbac: Record<string, ('create' | 'read' | 'update' | 'delete' | 'all')[]>;
}