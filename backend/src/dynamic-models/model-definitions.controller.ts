// backend/src/dynamic-models/model-definitions.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ModelDefinitionsService } from './model-definitions.service';
import { CreateModelDefinitionDto } from './dto/create-model-definition.dto';
import { RBACGuard } from '../shared/guards/rbac.guard';
import { Permission } from '../shared/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('model-definitions')
@UseGuards(JwtAuthGuard,RBACGuard) 
export class ModelDefinitionsController {
  constructor(private readonly modelDefinitionsService: ModelDefinitionsService) {}

  @Post()
  @Permission('create')
  create(@Body() createModelDefinitionDto: CreateModelDefinitionDto) {
    return this.modelDefinitionsService.create(createModelDefinitionDto);
  }

  @Get()
  @Permission('read')
  findAll() {
    return this.modelDefinitionsService.findAll();
  }

  @Get(':id')
  @Permission('read')
  findOne(@Param('id') id: string) {
    return this.modelDefinitionsService.findOne(id);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@Param('id') id: string) {
    return this.modelDefinitionsService.remove(id);
  }
}