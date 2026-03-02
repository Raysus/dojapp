import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DojoRole } from '@prisma/client'

type MembershipArgs = {
  select?: Record<string, any>
  include?: Record<string, any>
}

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) { }

  getMembership(userId: string, dojoId: string) {
    return this.prisma.dojoMembership.findUnique({
      where: { userId_dojoId: { userId, dojoId } },
      include: {
        dojo: true,
        user: true,
      },
    })
  }


  async assertUserInDojo(userId: string, dojoId: string, roles?: DojoRole[]) {
    const membership = await this.getMembership(userId, dojoId)

    if (!membership) {
      throw new ForbiddenException('No perteneces a este dojo')
    }

    if (roles && roles.length > 0 && !roles.includes(membership.role)) {
      throw new ForbiddenException('No tienes permisos suficientes')
    }

    return membership
  }

  async assertDojoRole(userId: string, dojoId: string, allowedRoles: DojoRole[]) {
    const membership = await this.getMembership(userId, dojoId)

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException()
    }

    return membership
  }

  async assertInstructorInDojo(userId: string, dojoId: string) {
    const membership = await this.getMembership(userId, dojoId)

    const allowedRoles = new Set<DojoRole>([
      DojoRole.PROFESSOR,
      DojoRole.INSTRUCTOR,
    ])

    if (!membership || !allowedRoles.has(membership.role)) {
      throw new ForbiddenException('No tienes permisos en este dojo')
    }

    return membership
  }

  async assertProfessorInDojo(userId: string, dojoId: string) {
    const membership = await this.getMembership(userId, dojoId)

    if (!membership || membership.role !== DojoRole.PROFESSOR) {
      throw new ForbiddenException('No tienes acceso a este dojo')
    }

    return membership
  }

  async assertStudentInDojo(studentUserId: string, dojoId: string) {
    const membership = await this.getMembership(studentUserId, dojoId)

    if (!membership || membership.role !== DojoRole.STUDENT) {
      throw new ForbiddenException('El usuario no es alumno del dojo')
    }

    return membership
  }
}
