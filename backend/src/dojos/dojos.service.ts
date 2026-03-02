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
        await this.authz.assertProfessorInDojo(userId, dojoId);

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


    async getUserDojoRole(userId: string, dojoId: string) {
        const membership = await this.authz.getMembership(userId, dojoId);

        return membership?.role ?? null;
    }

    async getStudentsWithGrade(dojoId: string, requestedById: string) {
        await this.authz.assertDojoRole(
            requestedById,
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

        return students.map(({ user }) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            grade: user.userStyles[0]?.grade ?? null,
        }));
    }

    async getContentsForStudent(dojoId: string, userId: string) {
        const membership = await this.authz.getMembership(userId, dojoId);

        if (!membership) {
            throw new ForbiddenException('No perteneces a este dojo');
        }

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

        return this.prisma.content.findMany({
            where: {
                styleId: membership.dojo.styleId,
                OR: [
                    { gradeId: null },
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

    async getGradesForDojo(dojoId: string, requestedById: string) {
        await this.authz.assertDojoRole(requestedById, dojoId, [DojoRole.PROFESSOR, DojoRole.INSTRUCTOR]);

        const dojo = await this.prisma.dojo.findUnique({
            where: { id: dojoId },
            select: { styleId: true },
        });

        if (!dojo) {
            throw new NotFoundException('Dojo no existe');
        }

        return this.prisma.grade.findMany({
            where: { styleId: dojo.styleId },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, order: true },
        });
    }

}
