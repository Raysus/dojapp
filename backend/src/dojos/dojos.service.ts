import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { DojoRole } from '@prisma/client';

@Injectable()
export class DojosService {
    constructor(
        private prisma: PrismaService,
        private authz: AuthorizationService

    ) { }

    getByProfessor(userId: string) {
        return this.prisma.dojo.findMany({
            where: {
                memberships: {
                    some: {
                        userId,
                        role: 'PROFESSOR',
                    },
                },
            },
        });
    }


    async getStudentsByDojo(dojoId: string, userId: string) {
        // 1️⃣ verificar que el usuario sea profesor en ese dojo
        const professorMembership = await this.prisma.dojoMembership.findUnique({
            where: {
                userId_dojoId: {
                    userId,
                    dojoId,
                },
            },
        });

        if (!professorMembership || professorMembership.role !== 'PROFESSOR') {
            throw new ForbiddenException('No tienes acceso a este dojo');
        }

        // 2️⃣ obtener estudiantes del dojo
        return this.prisma.dojoMembership.findMany({
            where: {
                dojoId,
                role: 'STUDENT',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }


    // ✅ MÉTODO CORRECTO
    async getUserDojoRole(userId: string, dojoId: string) {
        const membership = await this.prisma.dojoMembership.findUnique({
            where: {
                userId_dojoId: {
                    userId,
                    dojoId,
                },
            },
        });

        return membership?.role ?? null;
    }

    async getStudentsWithGrade(dojoId: string, requestedById: string) {
        // 1. Permisos
        await this.authz.assertDojoRole(
            requestedById,
            dojoId,
            [DojoRole.PROFESSOR, DojoRole.INSTRUCTOR]
        );

        // 2. Obtener dojo (para saber el estilo)
        const dojo = await this.prisma.dojo.findUnique({
            where: { id: dojoId },
            select: { styleId: true },
        });

        if (!dojo) {
            throw new NotFoundException('Dojo no existe');
        }

        // 3. Alumnos del dojo
        const students = await this.prisma.dojoMembership.findMany({
            where: {
                dojoId,
                role: DojoRole.STUDENT,
            },
            select: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        userStyles: {
                            where: { styleId: dojo.styleId },
                            select: {
                                grade: {
                                    select: {
                                        id: true,
                                        name: true,
                                        order: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // 4. Normalizar respuesta
        return students.map(({ user }) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            grade: user.userStyles[0]?.grade ?? null,
        }));
    }

    async getContentsForStudent(dojoId: string, userId: string) {
        // 1️⃣ validar membresía
        const membership = await this.prisma.dojoMembership.findUnique({
            where: {
                userId_dojoId: {
                    userId,
                    dojoId,
                },
            },
            select: {
                role: true,
                dojo: {
                    select: {
                        styleId: true,
                    },
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException('No perteneces a este dojo');
        }

        // 2️⃣ obtener grado del alumno en el estilo del dojo
        const userStyle = await this.prisma.userStyle.findUnique({
            where: {
                userId_styleId: {
                    userId,
                    styleId: membership.dojo.styleId,
                },
            },
            select: {
                grade: {
                    select: {
                        order: true,
                    },
                },
            },
        });

        const gradeOrder = userStyle?.grade?.order ?? 0;

        // 3️⃣ contenidos desbloqueados
        return this.prisma.content.findMany({
            where: {
                styleId: membership.dojo.styleId,
                OR: [
                    { gradeId: null }, // intro / general
                    {
                        grade: {
                            order: {
                                lte: gradeOrder,
                            },
                        },
                    },
                ],
            },
            orderBy: {
                grade: {
                    order: 'asc',
                },
            },
            select: {
                id: true,
                title: true,
                type: true,
                url: true,
                body: true,
                grade: {
                    select: {
                        name: true,
                        order: true,
                    },
                },
            },
        });
    }

}
