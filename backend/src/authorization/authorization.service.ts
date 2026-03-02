import { Injectable } from '@nestjs/common'
import { DojoRole } from '@prisma/client'
import { PermissionsService } from './permissions.service'

@Injectable()
export class AuthorizationService {
  constructor(private readonly perms: PermissionsService) { }
  
  getMembership(userId: string, dojoId: string) {
    return this.perms.getMembership(userId, dojoId)
  }

  assertDojoRole(userId: string, dojoId: string, allowedRoles: DojoRole[]) {
    return this.perms.assertDojoRole(userId, dojoId, allowedRoles)
  }

  assertUserInDojo(userId: string, dojoId: string, roles?: DojoRole[]) {
    return this.perms.assertUserInDojo(userId, dojoId, roles)
  }

  assertProfessorInDojo(userId: string, dojoId: string) {
    return this.perms.assertProfessorInDojo(userId, dojoId)
  }

  assertInstructorInDojo(userId: string, dojoId: string) {
    return this.perms.assertInstructorInDojo(userId, dojoId)
  }

  assertStudentInDojo(studentUserId: string, dojoId: string) {
    return this.perms.assertStudentInDojo(studentUserId, dojoId)
  }
}
