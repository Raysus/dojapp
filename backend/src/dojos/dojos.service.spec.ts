import { Test, TestingModule } from '@nestjs/testing'
import { DojosService } from './dojos.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuthorizationService } from 'src/authorization/authorization.service'

describe('DojosService', () => {
  let service: DojosService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DojosService,
        { provide: PrismaService, useValue: {} },
        { provide: AuthorizationService, useValue: {
          assertProfessorInDojo: jest.fn(),
          assertDojoRole: jest.fn(),
          getMembership: jest.fn(),
        } },
      ],
    }).compile()

    service = module.get<DojosService>(DojosService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
