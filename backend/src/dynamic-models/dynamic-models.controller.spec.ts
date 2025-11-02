import { Test, TestingModule } from '@nestjs/testing';
import { DynamicModelsController } from './dynamic-models.controller';

describe('DynamicModelsController', () => {
  let controller: DynamicModelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicModelsController],
    }).compile();

    controller = module.get<DynamicModelsController>(DynamicModelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
