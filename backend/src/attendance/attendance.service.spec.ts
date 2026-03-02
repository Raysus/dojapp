import { Test, TestingModule } from '@nestjs/testing'
import { AttendanceService } from './attendance.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuthorizationService } from '../authorization/authorization.service'

describe('AttendanceService', () => {
  let service: AttendanceService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: {
          attendance: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn() },
          dojoMembership: { findMany: jest.fn() },
        } },
        { provide: AuthorizationService, useValue: { assertInstructorInDojo: jest.fn() } },
      ],
    }).compile()

    service = module.get<AttendanceService>(AttendanceService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
