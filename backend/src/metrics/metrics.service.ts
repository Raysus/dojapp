import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentMetrics } from './dto/student-metrics.dto';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { DojoRole } from '@prisma/client';

@Injectable()
export class MetricsService {
    constructor(
        private prisma: PrismaService,
        private authz: AuthorizationService,
    ) { }

    async getDojoMetrics(professorId: string, dojoId: string): Promise<StudentMetrics[]> {
        await this.authz.assertInstructorInDojo(professorId, dojoId);

        const dojo = await this.prisma.dojo.findUnique({
            where: { id: dojoId },
        });
        if (!dojo) throw new NotFoundException();

        const students = await this.prisma.dojoMembership.findMany({
            where: { dojoId, role: DojoRole.STUDENT },
            include: { user: true },
        });

        const results: StudentMetrics[] = [];

        for (const membership of students) {
            const userId = membership.userId;

            const studentGrade = await this.prisma.studentGrade.findUnique({
                where: { userId_dojoId: { userId, dojoId } },
                include: { grade: true },
            });

            if (!studentGrade) {
                results.push({
                    userId,
                    name: membership.user.name,
                    grade: null,
                    completed: 0,
                    total: 0,
                    percentage: 0,
                    lastActivity: null,
                });
                continue;
            }

            const contents = await this.prisma.content.findMany({
                where: {
                    styleId: dojo.styleId,
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

            const lastActivity = await this.prisma.studentContent.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            });

            const total = contents.length;

            results.push({
                userId,
                name: membership.user.name,
                grade: studentGrade.grade.name,
                completed,
                total,
                percentage: total ? Math.round((completed / total) * 100) : 0,
                lastActivity: lastActivity?.createdAt ?? null,
            });
        }

        return results;
    }

}
