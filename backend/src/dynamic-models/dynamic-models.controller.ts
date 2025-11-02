// backend/src/dynamic-models/dynamic-models.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DynamicModelsService } from './dynamic-models.service';
import { RBACGuard } from '../shared/guards/rbac.guard';
import { Permission } from '../shared/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('dynamic')
@UseGuards(JwtAuthGuard,RBACGuard)
export class DynamicModelsController {
  constructor(private readonly dynamicModelsService: DynamicModelsService) {}

  @Post(':modelName')
  @Permission('create')
  async create( 
    @Param('modelName') modelName: string, 
    @Body() data: any,
    @Request() req: any
  ) {
    return this.dynamicModelsService.createRecord(modelName, data, req.user?.id);
  }

  @Get(':modelName')
  @Permission('read')
  async findAll(@Param('modelName') modelName: string) {
    return this.dynamicModelsService.findAllRecords(modelName);
  }

  @Get(':modelName/:id')
  @Permission('read')
  async findOne(@Param('modelName') modelName: string, @Param('id') id: string) {
    return this.dynamicModelsService.findRecordById(modelName, id);
  }

  @Put(':modelName/:id')
  @Permission('update')
  async update(
    @Param('modelName') modelName: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.dynamicModelsService.updateRecord(modelName, id, data);
  }

  @Delete(':modelName/:id')
  @Permission('delete')
  async remove(@Param('modelName') modelName: string, @Param('id') id: string) {
    return this.dynamicModelsService.deleteRecord(modelName, id);
  }
}