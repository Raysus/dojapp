import { Test, TestingModule } from '@nestjs/testing'
import { StudentsService } from './students.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuthorizationService } from 'src/authorization/authorization.service'

describe('StudentsService', () => {
  let service: StudentsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: {} },
        { provide: AuthorizationService, useValue: {
          assertProfessorInDojo: jest.fn(),
          assertDojoRole: jest.fn(),
          assertInstructorInDojo: jest.fn(),
          assertStudentInDojo: jest.fn(),
          getMembership: jest.fn(),
        } },
      ],
    }).compile()

    service = module.get<StudentsService>(StudentsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
