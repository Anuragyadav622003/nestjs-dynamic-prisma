import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DynamicModelsService } from './dynamic-models.service';
import { RBACGuard } from '../shared/guards/rbac.guard';
import { Permission } from '../shared/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Dynamic Models')
@ApiBearerAuth()
@Controller('dynamic')
@UseGuards(JwtAuthGuard, RBACGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class DynamicModelsController {
  constructor(private readonly dynamicModelsService: DynamicModelsService) {}

  @Post(':modelName')
  @Permission('create')
  @ApiOperation({ summary: 'Create a record in dynamic model' })
  @ApiResponse({ status: 201, description: 'Record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async create( 
    @Param('modelName') modelName: string, 
    @Body() data: any,
    @Request() req: any
  ) {
    return this.dynamicModelsService.createRecord(modelName, data, req.user?.id);
  }

  @Get(':modelName')
  @Permission('read')
  @ApiOperation({ summary: 'Get all records from dynamic model' })
  @ApiQuery({ name: 'filters', required: false, type: 'object' })
  @ApiResponse({ status: 200, description: 'Records retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async findAll(
    @Param('modelName') modelName: string,
    @Query() filters: any
  ) {
    return this.dynamicModelsService.findAllRecords(modelName, filters);
  }

  @Get(':modelName/:id')
  @Permission('read')
  @ApiOperation({ summary: 'Get a record by ID from dynamic model' })
  @ApiResponse({ status: 200, description: 'Record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async findOne(
    @Param('modelName') modelName: string, 
    @Param('id') id: string
  ) {
    return this.dynamicModelsService.findRecordById(modelName, id);
  }

  @Put(':modelName/:id')
  @Permission('update')
  @ApiOperation({ summary: 'Update a record in dynamic model' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async update(
    @Param('modelName') modelName: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.dynamicModelsService.updateRecord(modelName, id, data);
  }

  @Delete(':modelName/:id')
  @Permission('delete')
  @ApiOperation({ summary: 'Delete a record from dynamic model' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async remove(
    @Param('modelName') modelName: string, 
    @Param('id') id: string
  ) {
    return this.dynamicModelsService.deleteRecord(modelName, id);
  }
}