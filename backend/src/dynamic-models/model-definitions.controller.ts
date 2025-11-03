import { Controller, Get, Post, Body, Param, Delete, UseGuards, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ModelDefinitionsService } from './model-definitions.service';
import { CreateModelDefinitionDto } from './dto/create-model-definition.dto';
import { RBACGuard } from '../shared/guards/rbac.guard';
import { Permission } from '../shared/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Model Definitions')
@ApiBearerAuth()
@Controller('model-definitions')
@UseGuards(JwtAuthGuard, RBACGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class ModelDefinitionsController {
  constructor(private readonly modelDefinitionsService: ModelDefinitionsService) {}

  @Post()
  @Permission('create')
  @ApiOperation({ summary: 'Create a new model definition' })
  @ApiResponse({ status: 201, description: 'Model definition created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Table name already exists' })
  create(@Body() createModelDefinitionDto: CreateModelDefinitionDto) {
    return this.modelDefinitionsService.create(createModelDefinitionDto);
  }

  @Get()
  @Permission('read')
  @ApiOperation({ summary: 'Get all model definitions with grouping' })
  @ApiResponse({ status: 200, description: 'Model definitions retrieved successfully' })
  findAll() {
    return this.modelDefinitionsService.findAll();
  }

  @Get('name/:modelName')
  @Permission('read')
  @ApiOperation({ summary: 'Get all instances of a model by name' })
  @ApiResponse({ status: 200, description: 'Model instances retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No models found with this name' })
  findByName(@Param('modelName') modelName: string) {
    return this.modelDefinitionsService.findByName(modelName);
  }

  @Get(':id')
  @Permission('read')
  @ApiOperation({ summary: 'Get a model definition by ID' })
  @ApiResponse({ status: 200, description: 'Model definition retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Model definition not found' })
  findOne(@Param('id') id: string) {
    return this.modelDefinitionsService.findOne(id);
  }

  @Delete(':id')
  @Permission('delete')
  @ApiOperation({ summary: 'Soft delete a model definition by ID' })
  @ApiResponse({ status: 200, description: 'Model definition deleted successfully' })
  @ApiResponse({ status: 404, description: 'Model definition not found' })
  remove(@Param('id') id: string) {
    return this.modelDefinitionsService.remove(id);
  }

  @Delete('name/:modelName/table/:tableName')
  @Permission('delete')
  @ApiOperation({ summary: 'Soft delete a specific model instance by name and table' })
  @ApiResponse({ status: 200, description: 'Model instance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Model instance not found' })
  removeByNameAndTable(
    @Param('modelName') modelName: string,
    @Param('tableName') tableName: string
  ) {
    return this.modelDefinitionsService.removeByNameAndTable(modelName, tableName);
  }
}