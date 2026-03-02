import { Test, TestingModule } from '@nestjs/testing'
import { ContentsService } from './contents.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuthorizationService } from '../authorization/authorization.service'

describe('ContentsService', () => {
  let service: ContentsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentsService,
        { provide: PrismaService, useValue: {} },
        { provide: AuthorizationService, useValue: {
          assertDojoRole: jest.fn(),
          assertInstructorInDojo: jest.fn(),
          assertUserInDojo: jest.fn(),
          assertStudentInDojo: jest.fn(),
          getMembership: jest.fn(),
        } },
      ],
    }).compile()

    service = module.get<ContentsService>(ContentsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
