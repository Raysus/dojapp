import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DojoRole } from '@prisma/client'

@Injectable()
export class AuthorizationService {

  constructor(private prisma: PrismaService) { }

  async assertDojoRole(
    userId: string,
    dojoId: string,
    allowedRoles: DojoRole[]
  ) {
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: { userId, dojoId },
      },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException();
    }
  }


  async assertUserInDojo(
    userId: string,
    dojoId: string,
    roles?: DojoRole[],
  ) {
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: {
          userId,
          dojoId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('No perteneces a este dojo');
    }

    if (roles && !roles.includes(membership.role)) {
      throw new ForbiddenException('No tienes permisos suficientes');
    }

    return membership;
  }

  async assertProfessorInDojo(userId: string, dojoId: string) {
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: {
          userId,
          dojoId,
        },
      },
    });

    const allowedRoles = new Set<DojoRole>([
      DojoRole.PROFESSOR,
      DojoRole.INSTRUCTOR,
    ]);

    if (!membership || !allowedRoles.has(membership.role)) {
      throw new ForbiddenException('No tienes permisos en este dojo');
    }

  }
  async assertInstructorInDojo(userId: string, dojoId: string) {
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: {
          userId,
          dojoId,
        },
      },
    });

    const allowedRoles = new Set<DojoRole>([
      DojoRole.PROFESSOR,
      DojoRole.INSTRUCTOR,
    ]);

    if (!membership || !allowedRoles.has(membership.role)) {
      throw new ForbiddenException('No tienes permisos en este dojo');
    }
  }
}

