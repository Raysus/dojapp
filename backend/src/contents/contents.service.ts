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
    // 1️⃣ Validar que el usuario tenga rol en el dojo
    await this.authz.assertDojoRole(
      userId,
      dojoId,
      ['INSTRUCTOR', 'PROFESSOR'],
    );

    // 2️⃣ Crear contenido (ojo: NO existe dojoId en Content)
    return this.prisma.content.create({
      data: {
        title: data.title,
        type: data.type,
        url: data.url,
        body: data.body,
        styleId: data.styleId,
        gradeId: data.gradeId,
        createdById: userId,
      },
    });
  }

  async getByDojo(dojoId: string, userId: string) {
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: { userId, dojoId },
      },
    });

    if (!membership) {
      throw new ForbiddenException();
    }

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new ForbiddenException();
    }

    // Profesores / instructores → todo
    if (membership.role !== 'STUDENT') {
      return this.prisma.content.findMany({
        where: { styleId: dojo.styleId },
        orderBy: { title: 'asc' },
      });
    }

    // Alumno → obtener su grado
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
    // 1. Obtener el style del dojo
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new ForbiddenException('Dojo no existe');
    }

    // 2. Obtener el grado del alumno en ese dojo
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: {
          userId,
          dojoId,
        },
      }
    });

    if (!membership) {
      throw new ForbiddenException('Usuario no pertenece al dojo');
    }

    // 3. Contenido visible por grado
    return this.prisma.content.findMany({
      where: {
        styleId: dojo.styleId
      },
    });
  }

  async completeContent(contentId: string, userId: string) {
    // 1. Verificar que el contenido exista
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });

    if (!content) {
      throw new ForbiddenException('Contenido no existe');
    }

    // 2. Crear o actualizar el progreso
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
    // 1️⃣ verificar membresía del alumno en el dojo
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: {
          userId,
          dojoId,
        },
      },
      include: {
        dojo: {
          include: {
            style: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('No perteneces a este dojo');
    }

    // ⚠️ aquí asumimos que el grado del alumno está asociado al estilo
    // y que ya sabes cuál es el grado actual del alumno
    // (puedes cambiar esta parte luego sin romper nada)

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

    // 2️⃣ traer contenidos desbloqueados por grado
    const contents = await this.prisma.content.findMany({
      where: {
        styleId: membership.dojo.styleId,
        OR: [
          { gradeId: null },       // contenido libre
          { gradeId: grade.id },   // contenido del grado
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

    // 3️⃣ mapear completed
    return contents.map((content) => ({
      id: content.id,
      title: content.title,
      type: content.type,
      completed: content.studentContents[0]?.completed ?? false,
    }));
  }

  async getUnlockedForStudent(dojoId: string, userId: string) {
    // 1️⃣ membership del alumno
    const membership = await this.prisma.dojoMembership.findUnique({
      where: {
        userId_dojoId: {
          userId,
          dojoId,
        },
      },
      include: {
        dojo: {
          include: {
            style: true,
          },
        },
      },
    });

    if (!membership || membership.role !== 'STUDENT') {
      throw new ForbiddenException('No eres alumno de este dojo');
    }
  }

  async createForGrade(
    dojoId: string,
    gradeId: string,
    userId: string,
    dto: CreateContentDto,
  ) {
    // 1. Validar permisos en el dojo
    await this.authz.assertInstructorInDojo(userId, dojoId);

    // 2. Validar que el grado pertenece al estilo del dojo
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
    });

    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!dojo || !grade || grade.styleId !== dojo.styleId) {
      throw new ForbiddenException('Grado no pertenece al dojo');
    }

    // 3. Crear contenido
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
