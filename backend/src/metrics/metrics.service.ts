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
            select: { id: true, styleId: true },
        });
        if (!dojo) throw new NotFoundException();

        const memberships = await this.prisma.dojoMembership.findMany({
            where: { dojoId, role: DojoRole.STUDENT },
            select: {
                userId: true,
                user: { select: { id: true, name: true } },
            },
            orderBy: { user: { name: 'asc' } },
        });

        if (memberships.length === 0) return [];

        const userIds = memberships.map(m => m.userId);

        const [studentGrades, allContents, completions] = await Promise.all([
            this.prisma.studentGrade.findMany({
                where: { dojoId, userId: { in: userIds } },
                include: { grade: { select: { id: true, name: true, order: true } } },
            }),
            this.prisma.content.findMany({
                where: { styleId: dojo.styleId },
                select: {
                    id: true,
                    gradeId: true,
                    grade: { select: { order: true } },
                },
            }),
            this.prisma.studentContent.findMany({
                where: {
                    userId: { in: userIds },
                    completed: true,
                },
                select: {
                    userId: true,
                    contentId: true,
                    createdAt: true,
                },
            }),
        ]);

        const gradeByUser = new Map(studentGrades.map(sg => [sg.userId, sg]));
        const completedByUser = new Map<string, Set<string>>();
        const lastActivityByUser = new Map<string, Date>();

        for (const row of completions) {
            let set = completedByUser.get(row.userId);
            if (!set) {
                set = new Set();
                completedByUser.set(row.userId, set);
            }
            set.add(row.contentId);

            const prev = lastActivityByUser.get(row.userId);
            if (!prev || row.createdAt > prev) {
                lastActivityByUser.set(row.userId, row.createdAt);
            }
        }

        return memberships.map(membership => {
            const userId = membership.userId;
            const studentGrade = gradeByUser.get(userId);

            if (!studentGrade) {
                return {
                    userId,
                    name: membership.user.name,
                    grade: null,
                    completed: 0,
                    total: 0,
                    percentage: 0,
                    lastActivity: lastActivityByUser.get(userId) ?? null,
                };
            }

            const visibleIds = allContents
                .filter(c => !c.gradeId || (c.grade?.order ?? Infinity) <= studentGrade.grade.order)
                .map(c => c.id);

            const completedSet = completedByUser.get(userId) ?? new Set();
            const completed = visibleIds.filter(id => completedSet.has(id)).length;
            const total = visibleIds.length;

            return {
                userId,
                name: membership.user.name,
                grade: studentGrade.grade.name,
                completed,
                total,
                percentage: total ? Math.round((completed / total) * 100) : 0,
                lastActivity: lastActivityByUser.get(userId) ?? null,
            };
        });
    }
}
