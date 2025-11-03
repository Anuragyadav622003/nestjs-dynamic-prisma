import { IsString, IsArray, IsObject, IsOptional, IsBoolean, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../shared/types';

export class ModelFieldDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['string', 'number', 'boolean', 'date', 'text'] })
  @IsEnum(['string', 'number', 'boolean', 'date', 'text'])
type!: FieldType;

  @ApiProperty({ example: true })
  @IsBoolean()
  required!: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  default?: any;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  relation?: {
    model: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one';
  };
}

export class CreateModelDefinitionDto {
  @ApiProperty({ example: 'Product' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'products', required: false })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiProperty({ type: [ModelFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModelFieldDto)
  fields!: ModelFieldDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerField?: string;

  @ApiProperty({ 
    example: { 
      Admin: ['all'], 
      Manager: ['create', 'read', 'update'], 
      Viewer: ['read'] 
    } 
  })
  @IsObject()
  rbac!: Record<string, ('create' | 'read' | 'update' | 'delete' | 'all')[]>;
}