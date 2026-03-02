import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/create-student.dto';
import { getUnlockedContentIds } from './utils/unlock-contents';
import { ContentType, DojoRole, UserRole } from '@prisma/client';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { StudentProgressHistory } from './dto/student-progress-history.dto';

type StudentDojoContents = {
  dojoId: string;
  dojoName: string;
  grade: string;
  contents: {
    id: string;
    title: string;
    type: ContentType;
    url: string | null;
    body: string | null;
    gradeId: string | null;
    styleId: string;
    createdById: string;
  }[];
};

type StudentContentsByDojo = {
  dojoId: string;
  dojoName: string;
  grade: string;
  contents: {
    id: string;
    title: string;
    type: ContentType;
    url: string | null;
    body: string | null;
    createdAt: Date;
    styleId: string;
    gradeId: string | null;
    createdById: string;
  }[];
};


@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService
  ) { }

  getMyInfo(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentContents: true,
        dojoMemberships: {
          include: {
            dojo: true,
          },
        },
      },
    })
  }

  async getByIdForProfessor(
    studentUserId: string,
    dojoId: string,
    authUser: { sub: string; role: UserRole }
  ) {
    await this.authz.assertProfessorInDojo(
      authUser.sub,
      dojoId
    )

    const student = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      include: {
        studentContents: true,
        dojoMemberships: {
          where: {
            dojoId,
            role: DojoRole.STUDENT,
          },
        },
      },
    })

    if (!student) {
      throw new NotFoundException('Alumno no encontrado')
    }

    return student
  }

  async promoteStudent(
    dojoId: string,
    studentId: string,
    newGradeId: string,
    performedById: string
  ) {
    await this.authz.assertDojoRole(
      performedById,
      dojoId,
      [DojoRole.PROFESSOR, DojoRole.INSTRUCTOR]
    );

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new NotFoundException('Dojo no existe');
    }

    await this.authz.assertStudentInDojo(studentId, dojoId);
    const userStyle = await this.prisma.userStyle.findUnique({
      where: {
        userId_styleId: {
          userId: studentId,
          styleId: dojo.styleId,
        },
      },
      include: {
        grade: true,
      },
    });

    if (!userStyle) {
      throw new NotFoundException('El alumno no tiene estilo asignado');
    }

    const newGrade = await this.prisma.grade.findUnique({
      where: { id: newGradeId },
    });

    if (!newGrade || newGrade.styleId !== dojo.styleId) {
      throw new BadRequestException('Grado inválido para este estilo');
    }

    if (newGrade.order <= userStyle.grade.order) {
      throw new BadRequestException(
        'El nuevo grado debe ser superior al actual'
      );
    }

    return this.prisma.userStyle.update({
      where: { id: userStyle.id },
      data: { gradeId: newGradeId },
      include: {
        grade: true,
      },
    });
  }

  async updateGrade(
    dojoId: string,
    studentId: string,
    gradeId: string,
    professorId: string,
  ) {
    await this.authz.assertProfessorInDojo(professorId, dojoId);

    const membership = await this.authz.getMembership(studentId, dojoId);

    if (!membership) {
      throw new NotFoundException('El alumno no pertenece a este dojo');
    }

    if (membership.role !== DojoRole.STUDENT) {
      throw new ForbiddenException('El usuario no es estudiante de este dojo');
    }
    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!grade || grade.styleId !== membership.dojo.styleId) {
      throw new BadRequestException('Grado inválido para este dojo');
    }
    return this.prisma.studentGrade.upsert({
      where: {
        userId_dojoId: {
          userId: studentId,
          dojoId,
        },
      },
      update: {
        gradeId,
      },
      create: {
        userId: studentId,
        dojoId,
        gradeId,
      },
    });
  }

  async getStudentGrade(dojoId: string, studentId: string) {
    const studentGrade = await this.prisma.studentGrade.findUnique({
      where: {
        userId_dojoId: {
          userId: studentId,
          dojoId,
        },
      },
      include: {
        grade: true,
      },
    });
  }

  async getForStudent(userId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        dojoMemberships: {
          include: {
            dojo: true,
          },
        },
        studentContents: false,
      },
    });

    if (!student) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const membership = student.dojoMemberships.find(
      m => m.role === DojoRole.STUDENT,
    );

    if (!membership) {
      throw new ForbiddenException('No eres estudiante');
    }

    const grade = await this.prisma.grade.findFirst({
      where: {
        styleId: membership.dojo.styleId,
      },
    });
    if (!grade) {
      throw new ForbiddenException('El estudiante no tiene grado asignado');
    }
    return this.prisma.content.findMany({
      where: {
        gradeId: grade.id,
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async assignGrade(
    professorId: string,
    dojoId: string,
    studentId: string,
    gradeId: string,
  ) {
    await this.authz.assertInstructorInDojo(professorId, dojoId);

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
    });

    if (!dojo) {
      throw new ForbiddenException('Dojo no encontrado');
    }

    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!grade || grade.styleId !== dojo.styleId) {
      throw new ForbiddenException('Grado no pertenece al estilo del dojo');
    }

    await this.authz.assertStudentInDojo(studentId, dojoId);
    return this.prisma.studentGrade.upsert({
      where: {
        userId_dojoId: {
          userId: studentId,
          dojoId,
        }
      },
      update: {
        gradeId,
      },
      create: {
        userId: studentId,
        dojoId,
        gradeId,
      },
    });
  }

  async getAvailableContents(userId: string) {
    const studentGrades = await this.prisma.studentGrade.findMany({
      where: { userId },
      include: {
        dojo: { include: { style: true } },
        grade: true,
      },
    });

    const results: StudentContentsByDojo[] = [];

    for (const studentGrade of studentGrades) {
      const contents = await this.prisma.content.findMany({
        where: {
          styleId: studentGrade.dojo.styleId,
          OR: [
            { gradeId: null },
            {
              grade: {
                order: { lte: studentGrade.grade.order },
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      results.push({
        dojoId: studentGrade.dojo.id,
        dojoName: studentGrade.dojo.name,
        grade: studentGrade.grade.name,
        contents,
      });
    }

    return results;
  }

  async getVisibleContentsForStudentInDojo(
    studentId: string,
    dojoId: string,
    authUser: { sub: string; role: UserRole },
  ) {
    await this.authz.assertDojoRole(authUser.sub, dojoId, [DojoRole.PROFESSOR, DojoRole.INSTRUCTOR]);

    const sg = await this.prisma.studentGrade.findUnique({
      where: { userId_dojoId: { userId: studentId, dojoId } },
      include: {
        dojo: true,
        grade: true,
      },
    });

    if (!sg) {
      throw new NotFoundException('El alumno no tiene grado asignado en este dojo');
    }

    const contents = await this.prisma.content.findMany({
      where: {
        styleId: sg.dojo.styleId,
        OR: [
          { gradeId: null },
          {
            grade: {
              order: { lte: sg.grade.order },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      dojoId: sg.dojo.id,
      dojoName: sg.dojo.name,
      grade: sg.grade.name,
      gradeId: sg.grade.id,
      contents,
    };
  }

  async getContentsForStudent(userId: string) {
    const memberships = await this.prisma.dojoMembership.findMany({
      where: {
        userId,
        role: 'STUDENT',
      },
      include: {
        dojo: {
          include: {
            style: true,
          },
        },
      },
    });

    const results: StudentContentsByDojo[] = [];

    for (const membership of memberships) {
      const studentGrade = await this.prisma.studentGrade.findUnique({
        where: {
          userId_dojoId: {
            userId,
            dojoId: membership.dojoId,
          },
        },
        include: {
          grade: true,
        },
      });

      if (!studentGrade) continue;

      const contents = await this.prisma.content.findMany({
        where: {
          styleId: membership.dojo.styleId,
          OR: [
            { gradeId: null },
            {
              grade: {
                order: {
                  lte: studentGrade.grade.order,
                },
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      results.push({
        dojoId: membership.dojo.id,
        dojoName: membership.dojo.name,
        grade: studentGrade.grade.name,
        contents,
      });
    }

    return results;
  }

  async assignGradeToStudent(
    professorId: string,
    dojoId: string,
    studentId: string,
    gradeId: string,
  ) {
    await this.authz.assertInstructorInDojo(professorId, dojoId);

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
    });
    if (!dojo) throw new NotFoundException('Dojo not found');

    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });
    if (!grade || grade.styleId !== dojo.styleId) {
      throw new BadRequestException('Grade does not belong to dojo style');
    }

    return this.prisma.studentGrade.upsert({
      where: {
        userId_dojoId: {
          userId: studentId,
          dojoId,
        },
      },
      update: {
        gradeId,
      },
      create: {
        userId: studentId,
        dojoId,
        gradeId,
      },
    });
  }

  async createSnapshot(userId: string, dojoId: string) {
    const studentGrade = await this.prisma.studentGrade.findUnique({
      where: { userId_dojoId: { userId, dojoId } },
      include: { grade: true },
    });

    if (!studentGrade) return;

    const contents = await this.prisma.content.findMany({
      where: {
        styleId: studentGrade.grade.styleId,
        OR: [
          { gradeId: null },
          { grade: { order: { lte: studentGrade.grade.order } } },
        ],
      },
      select: { id: true },
    });

    const completed = await this.prisma.studentContent.count({
      where: {
        userId,
        completed: true,
        contentId: { in: contents.map(c => c.id) },
      },
    });

    const total = contents.length;

    await this.prisma.studentProgressSnapshot.create({
      data: {
        userId,
        dojoId,
        gradeId: studentGrade.gradeId,
        completed,
        total,
        percentage: total ? Math.round((completed / total) * 100) : 0,
      },
    });
  }

  async getStudentHistory(
    professorId: string,
    dojoId: string,
    studentId: string,
  ): Promise<StudentProgressHistory[]> {

    await this.authz.assertInstructorInDojo(professorId, dojoId);

    const snapshots = await this.prisma.studentProgressSnapshot.findMany({
      where: {
        dojoId,
        userId: studentId,
      },
      include: {
        grade: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return snapshots.map(s => ({
      date: s.createdAt,
      grade: s.grade?.name ?? null,
      percentage: s.percentage,
      completed: s.completed,
      total: s.total,
    }));
  }

  async completeContentForStudent(userId: string, contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });

    if (!content) {
      throw new NotFoundException('Contenido no existe');
    }

    return this.prisma.studentContent.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      update: { completed: true },
      create: { userId, contentId, completed: true },
    });
  }

  async toggleStudentContent(
    performedById: string,
    dojoId: string,
    studentId: string,
    contentId: string,
  ) {
    await this.authz.assertDojoRole(performedById, dojoId, [
      DojoRole.PROFESSOR,
      DojoRole.INSTRUCTOR,
    ]);

    await this.authz.assertStudentInDojo(studentId, dojoId);

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new NotFoundException('Dojo no existe');
    }

    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, styleId: true },
    });

    if (!content) {
      throw new NotFoundException('Contenido no existe');
    }

    if (content.styleId !== dojo.styleId) {
      throw new BadRequestException('Contenido no pertenece a este dojo');
    }

    const existing = await this.prisma.studentContent.findUnique({
      where: {
        userId_contentId: {
          userId: studentId,
          contentId,
        },
      },
      select: { completed: true },
    });

    const nextCompleted = !(existing?.completed ?? false);

    return this.prisma.studentContent.upsert({
      where: {
        userId_contentId: {
          userId: studentId,
          contentId,
        },
      },
      update: { completed: nextCompleted },
      create: { userId: studentId, contentId, completed: nextCompleted },
    });
  }

}
