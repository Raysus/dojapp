import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { CreateContentDto } from './dto/create-content.dto';

@Injectable()
export class ContentsService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
  ) { }

  async create(
  dojoId: string,
  userId: string,
  data: CreateContentDto,
) {

  await this.authz.assertDojoRole(
    userId,
    dojoId,
    ['INSTRUCTOR', 'PROFESSOR'],
  );

  const dojo = await this.prisma.dojo.findUnique({
    where: { id: dojoId },
    select: { styleId: true },
  });

  if (!dojo) {
    throw new ForbiddenException('Dojo no existe');
  }

  if (data.gradeId) {
    const grade = await this.prisma.grade.findUnique({
      where: { id: data.gradeId },
      select: { styleId: true },
    });

    if (!grade || grade.styleId !== dojo.styleId) {
      throw new ForbiddenException('Grado no pertenece al dojo');
    }
  }

  return this.prisma.content.create({
    data: {
      title: data.title,
      type: data.type,
      url: data.url,
      body: data.body,
      styleId: dojo.styleId,
      gradeId: data.gradeId ?? null,
      createdById: userId,
    },
  });
}

  async getByDojo(dojoId: string, userId: string) {
    const membership = await this.authz.assertUserInDojo(userId, dojoId);

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new ForbiddenException();
    }

    if (membership.role !== 'STUDENT') {
      return this.prisma.content.findMany({
        where: { styleId: dojo.styleId },
        orderBy: { title: 'asc' },
      });
    }

    const userStyle = await this.prisma.userStyle.findUnique({
      where: {
        userId_styleId: {
          userId,
          styleId: dojo.styleId,
        },
      },
      select: {
        grade: { select: { order: true } },
      },
    });

    if (!userStyle) {
      throw new ForbiddenException('El alumno no tiene grado asignado');
    }

    return this.prisma.content.findMany({
      where: {
        styleId: dojo.styleId,
        OR: [
          { gradeId: null },
          {
            grade: {
              order: {
                lte: userStyle.grade.order,
              },
            },
          },
        ],
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async findVisibleForStudent(dojoId: string, userId: string) {
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new ForbiddenException('Dojo no existe');
    }

    await this.authz.assertUserInDojo(userId, dojoId);

    return this.prisma.content.findMany({
      where: {
        styleId: dojo.styleId
      },
    });
  }

  async completeContent(contentId: string, userId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });

    if (!content) {
      throw new ForbiddenException('Contenido no existe');
    }

    return this.prisma.studentContent.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        userId,
        contentId,
        completed: true,
      },
    });
  }

  async listForStudent(dojoId: string, userId: string) {
    const membership = await this.authz.getMembership(userId, dojoId);

    if (!membership) {
      throw new ForbiddenException('No perteneces a este dojo');
    }

    const grade = await this.prisma.grade.findFirst({
      where: {
        styleId: membership.dojo.styleId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    if (!grade) {
      return [];
    }

    const contents = await this.prisma.content.findMany({
      where: {
        styleId: membership.dojo.styleId,
        OR: [
          { gradeId: null },
          { gradeId: grade.id },
        ],
      },
      include: {
        studentContents: {
          where: {
            userId,
          },
          select: {
            completed: true,
          },
        },
      },
    });

    return contents.map((content) => ({
      id: content.id,
      title: content.title,
      type: content.type,
      completed: content.studentContents[0]?.completed ?? false,
    }));
  }

  async getUnlockedForStudent(dojoId: string, userId: string) {
    await this.authz.assertStudentInDojo(userId, dojoId);
  }

  async createForGrade(
    dojoId: string,
    gradeId: string,
    userId: string,
    dto: CreateContentDto,
  ) {
    await this.authz.assertInstructorInDojo(userId, dojoId);

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
    });

    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!dojo || !grade || grade.styleId !== dojo.styleId) {
      throw new ForbiddenException('Grado no pertenece al dojo');
    }

    return this.prisma.content.create({
      data: {
        title: dto.title,
        type: dto.type,
        url: dto.url,
        body: dto.body,
        gradeId,
        styleId: dojo.styleId,
        createdById: userId,
      },
    });
  }


  async getByGrade(dojoId: string, gradeId: string) {
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
    });

    if (!dojo) {
      throw new ForbiddenException('Dojo no encontrado');
    }


    return this.prisma.content.findMany({
      where: {
        gradeId,
        styleId: dojo.styleId,
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

}
