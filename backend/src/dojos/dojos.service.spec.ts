import { Test, TestingModule } from '@nestjs/testing';
import { DojosService } from './dojos.service';

describe('DojosService', () => {
  let service: DojosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DojosService],
    }).compile();

    service = module.get<DojosService>(DojosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
