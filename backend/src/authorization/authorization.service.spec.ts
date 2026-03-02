import { Test, TestingModule } from '@nestjs/testing'
import { AuthorizationService } from './authorization.service'
import { PermissionsService } from './permissions.service'

describe('AuthorizationService', () => {
  let service: AuthorizationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: PermissionsService, useValue: {
          getMembership: jest.fn(),
          assertDojoRole: jest.fn(),
          assertUserInDojo: jest.fn(),
          assertProfessorInDojo: jest.fn(),
          assertInstructorInDojo: jest.fn(),
          assertStudentInDojo: jest.fn(),
        } },
      ],
    }).compile()

    service = module.get<AuthorizationService>(AuthorizationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
