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
    completed: boolean;
  }[];
};

type StudentStatsByDojo = {
  dojoId: string
  dojoName: string
  grade: string
  progress: {
    completed: number
    total: number
    percentage: number
  }
  attendance: {
    attendedClasses: number
    totalClasses: number
    percentage: number
  }
}


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
    // 🔐 permiso real
    await this.authz.assertInstructorInDojo(
      authUser.sub,
      dojoId
    )

    const student = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        studentContents: {
          select: { contentId: true, completed: true },
        },
        studentGrades: {
          where: { dojoId },
          select: {
            grade: { select: { id: true, name: true, order: true } },
          },
        },
        dojoMemberships: {
          where: {
            dojoId,
            role: DojoRole.STUDENT,
          },
          select: { role: true },
        },
      },
    })

    if (!student) {
      throw new NotFoundException('Alumno no encontrado')
    }

    if (!student.dojoMemberships.length) {
      throw new NotFoundException('Alumno no pertenece a este dojo')
    }

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      createdAt: student.createdAt,
      grade: student.studentGrades[0]?.grade ?? null,
      studentContents: student.studentContents,
    }
  }

  async promoteStudent(
    dojoId: string,
    studentId: string,
    newGradeId: string,
    performedById: string
  ) {
    // 1. Validar permisos (profesor/instructor)
    await this.authz.assertDojoRole(
      performedById,
      dojoId,
      [DojoRole.PROFESSOR, DojoRole.INSTRUCTOR]
    );

    // 2. Obtener dojo + estilo
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    });

    if (!dojo) {
      throw new NotFoundException('Dojo no existe');
    }

    // 3. Verificar que el alumno pertenece al dojo
    await this.authz.assertStudentInDojo(studentId, dojoId);
    // 4. Obtener UserStyle del alumno
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

    // 5. Obtener nuevo grado
    const newGrade = await this.prisma.grade.findUnique({
      where: { id: newGradeId },
    });

    if (!newGrade || newGrade.styleId !== dojo.styleId) {
      throw new BadRequestException('Grado inválido para este estilo');
    }

    // 6. Validar progresión
    if (newGrade.order <= userStyle.grade.order) {
      throw new BadRequestException(
        'El nuevo grado debe ser superior al actual'
      );
    }

    // 7. Actualizar grado
    const updated = await this.prisma.userStyle.update({
      where: { id: userStyle.id },
      data: { gradeId: newGradeId },
      include: {
        grade: true,
      },
    });

    await this.prisma.studentGrade.upsert({
      where: { userId_dojoId: { userId: studentId, dojoId } },
      update: { gradeId: newGradeId },
      create: { userId: studentId, dojoId, gradeId: newGradeId },
    });

    return updated;
  }

  async updateGrade(
    dojoId: string,
    studentId: string,
    gradeId: string,
    professorId: string,
  ) {
    return this.assignGradeToStudent(professorId, dojoId, studentId, gradeId);
  }

  async getStudentGrade(dojoId: string, studentId: string) {
    return this.prisma.studentGrade.findUnique({
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

    // 👇 acá luego usas el grado asignado
    const grade = await this.prisma.grade.findFirst({
      where: {
        styleId: membership.dojo.styleId,
        // luego: gradeId del alumno
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
    return this.assignGradeToStudent(professorId, dojoId, studentId, gradeId);
  }

  async getAvailableContents(userId: string) {
    const studentGrades = await this.prisma.studentGrade.findMany({
      where: { userId },
      include: {
        dojo: { include: { style: true } },
        grade: true,
      },
    });

    const completedIds = new Set(
      (
        await this.prisma.studentContent.findMany({
          where: { userId, completed: true },
          select: { contentId: true },
        })
      ).map(x => x.contentId),
    );

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
        orderBy: [{ gradeId: 'asc' }, { title: 'asc' }],
      });

      results.push({
        dojoId: studentGrade.dojo.id,
        dojoName: studentGrade.dojo.name,
        grade: studentGrade.grade.name,
        contents: contents.map(c => ({
          ...c,
          completed: completedIds.has(c.id),
        })),
      });
    }

    return results;
  }

  /**
   * Student self-service: stats per dojo (progress + attendance).
   *
   * - Progress is computed over the same visible contents as /students/me/contents
   *   (global + up to the student's grade in each dojo).
   * - Attendance is computed over distinct attendance days for the dojo.
   */
  async getMyStats(userId: string): Promise<StudentStatsByDojo[]> {
    const visible = await this.getAvailableContents(userId)

    // Completed content ids for the user (global across dojos/styles)
    const completedIds = new Set(
      (
        await this.prisma.studentContent.findMany({
          where: { userId, completed: true },
          select: { contentId: true },
        })
      ).map((x) => x.contentId),
    )

    const dojoIds = visible.map((v) => v.dojoId)
    const [totalDaysByDojo, attendedByDojo] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ['dojoId', 'date'],
        where: { dojoId: { in: dojoIds } },
      }),
      this.prisma.attendance.groupBy({
        by: ['dojoId'],
        where: { dojoId: { in: dojoIds }, userId, present: true },
        _count: { _all: true },
      }),
    ])

    const totalClassesMap = new Map<string, number>()
    for (const row of totalDaysByDojo) {
      totalClassesMap.set(row.dojoId, (totalClassesMap.get(row.dojoId) ?? 0) + 1)
    }

    const attendedMap = new Map<string, number>()
    for (const row of attendedByDojo) {
      attendedMap.set(row.dojoId, row._count._all)
    }

    return visible.map((v) => {
      const total = v.contents.length
      const completed = v.contents.filter((c) => completedIds.has(c.id)).length
      const percentage = total ? Math.round((completed / total) * 100) : 0

      const totalClasses = totalClassesMap.get(v.dojoId) ?? 0
      const attendedClasses = attendedMap.get(v.dojoId) ?? 0
      const attendancePercentage = totalClasses
        ? Math.round((attendedClasses / totalClasses) * 100)
        : 0

      return {
        dojoId: v.dojoId,
        dojoName: v.dojoName,
        grade: v.grade,
        progress: {
          completed,
          total,
          percentage,
        },
        attendance: {
          attendedClasses,
          totalClasses,
          percentage: attendancePercentage,
        },
      }
    })
  }
  /**
   * Professor/Instructor helper: list the contents that are visible for a given student in a dojo
   * (global contents + contents up to the student's grade in that dojo).
   *
   * This does NOT depend on progress/unlocks.
   */
  async getVisibleContentsForStudentInDojo(
    studentId: string,
    dojoId: string,
    authUser: { sub: string; role: UserRole },
  ) {
    // Permiso: profesor/instructor en el dojo
    await this.authz.assertDojoRole(authUser.sub, dojoId, [DojoRole.PROFESSOR, DojoRole.INSTRUCTOR]);

    // Grado del estudiante en este dojo
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
    return this.getAvailableContents(userId);
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

    const studentGrade = await this.prisma.studentGrade.upsert({
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

    // Keep UserStyle in sync — student content visibility reads this table.
    await this.prisma.userStyle.upsert({
      where: {
        userId_styleId: { userId: studentId, styleId: dojo.styleId },
      },
      update: { gradeId },
      create: { userId: studentId, styleId: dojo.styleId, gradeId },
    });

    return studentGrade;
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

  /**
   * Student self endpoint: mark a content as completed (idempotent).
   */
  async completeContentForStudent(userId: string, contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { grade: true },
    });

    if (!content) {
      throw new NotFoundException('Contenido no existe');
    }

    const studentGrades = await this.prisma.studentGrade.findMany({
      where: {
        userId,
        dojo: { styleId: content.styleId },
      },
      include: { grade: true },
    });

    if (studentGrades.length === 0) {
      throw new ForbiddenException('No tienes acceso a este contenido');
    }

    const canAccess = studentGrades.some((sg) => {
      if (!content.gradeId) return true;
      if (!sg.grade || !content.grade) return false;
      return content.grade.order <= sg.grade.order;
    });

    if (!canAccess) {
      throw new ForbiddenException('Contenido no disponible para tu grado');
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

  /**
   * Professor/Instructor: toggle completion status for a student on a given dojo.
   */
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

  /**
   * Professor/instructor creates a new student or enrolls an existing one in this dojo.
   */
  async addStudentToDojo(
    dojoId: string,
    actorUserId: string,
    dto: CreateStudentDto,
  ) {
    await this.authz.assertDojoRole(actorUserId, dojoId, [
      DojoRole.PROFESSOR,
      DojoRole.INSTRUCTOR,
    ]);

    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('El nombre es obligatorio');

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { id: true, styleId: true },
    });
    if (!dojo) throw new NotFoundException('Dojo no existe');

    const grade = await this.prisma.grade.findUnique({
      where: { id: dto.gradeId },
      select: { id: true, styleId: true },
    });
    if (!grade || grade.styleId !== dojo.styleId) {
      throw new BadRequestException('Grado no pertenece al dojo');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      if (!dto.password || dto.password.length < 6) {
        throw new BadRequestException(
          'La contraseña es obligatoria (mín. 6 caracteres) para alumnos nuevos',
        );
      }
      const passwordHash = await bcrypt.hash(dto.password, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          role: UserRole.STUDENT,
        },
        select: { id: true, email: true, name: true, role: true },
      });
    } else {
      if (user.role === UserRole.ADMIN) {
        throw new BadRequestException('No se puede agregar un administrador como alumno');
      }
      if (user.name !== name) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { name },
          select: { id: true, email: true, name: true, role: true },
        });
      }
    }

    await this.prisma.dojoMembership.upsert({
      where: { userId_dojoId: { userId: user.id, dojoId } },
      update: { role: DojoRole.STUDENT },
      create: { userId: user.id, dojoId, role: DojoRole.STUDENT },
    });

    await this.prisma.studentGrade.upsert({
      where: { userId_dojoId: { userId: user.id, dojoId } },
      update: { gradeId: dto.gradeId },
      create: { userId: user.id, dojoId, gradeId: dto.gradeId },
    });

    await this.prisma.userStyle.upsert({
      where: { userId_styleId: { userId: user.id, styleId: dojo.styleId } },
      update: { gradeId: dto.gradeId },
      create: { userId: user.id, styleId: dojo.styleId, gradeId: dto.gradeId },
    });

    return user;
  }

}
