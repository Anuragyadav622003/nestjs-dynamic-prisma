import { Test, TestingModule } from '@nestjs/testing';
import { DynamicModelsService } from './dynamic-models.service';

describe('DynamicModelsService', () => {
  let service: DynamicModelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamicModelsService],
    }).compile();

    service = module.get<DynamicModelsService>(DynamicModelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
