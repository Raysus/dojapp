import { Test, TestingModule } from '@nestjs/testing'
import { MetricsService } from './metrics.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthorizationService } from 'src/authorization/authorization.service'

describe('MetricsService', () => {
  let service: MetricsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: {
          dojo: { findUnique: jest.fn() },
          dojoMembership: { findMany: jest.fn() },
          studentGrade: { findUnique: jest.fn() },
          content: { findMany: jest.fn() },
          studentContent: { count: jest.fn(), findFirst: jest.fn() },
        } },
        { provide: AuthorizationService, useValue: { assertInstructorInDojo: jest.fn() } },
      ],
    }).compile()

    service = module.get<MetricsService>(MetricsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
