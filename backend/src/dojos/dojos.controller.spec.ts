import { Test, TestingModule } from '@nestjs/testing'
import { DojosController } from './dojos.controller'
import { DojosService } from './dojos.service'

describe('DojosController', () => {
  let controller: DojosController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DojosController],
      providers: [{ provide: DojosService, useValue: {} }],
    }).compile()

    controller = module.get<DojosController>(DojosController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
