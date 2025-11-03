import { Controller, Get, Post, Body, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModelDefinitionsService } from './model-definitions.service';
import { CreateModelDefinitionDto } from './dto/create-model-definition.dto';
import { RBACGuard } from '../shared/guards/rbac.guard';
import { Permission } from '../shared/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
  @ApiResponse({ status: 409, description: 'Model already exists' })
  create(@Body() createModelDefinitionDto: CreateModelDefinitionDto) {
    return this.modelDefinitionsService.create(createModelDefinitionDto);
  }

  @Get()
  @Permission('read')
  @ApiOperation({ summary: 'Get all model definitions' })
  @ApiResponse({ status: 200, description: 'Model definitions retrieved successfully' })
  findAll() {
    return this.modelDefinitionsService.findAll();
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
  @ApiOperation({ summary: 'Soft delete a model definition' })
  @ApiResponse({ status: 200, description: 'Model definition deleted successfully' })
  @ApiResponse({ status: 404, description: 'Model definition not found' })
  remove(@Param('id') id: string) {
    return this.modelDefinitionsService.remove(id);
  }
}