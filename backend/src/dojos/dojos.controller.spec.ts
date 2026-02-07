import { Test, TestingModule } from '@nestjs/testing';
import { DojosController } from './dojos.controller';

describe('DojosController', () => {
  let controller: DojosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DojosController],
    }).compile();

    controller = module.get<DojosController>(DojosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
