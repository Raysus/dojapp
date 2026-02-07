import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { startOfDay, endOfDay } from 'date-fns'

@Injectable()
export class AttendanceService {
    constructor(private readonly prisma: PrismaService) { }

    async markAttendance({
        dojoId,
        userId,
        present,
        takenById,
        date,
    }: {
        dojoId: string
        userId: string
        present: boolean
        takenById: string
        date?: Date
    }) {
        const day = date ?? new Date()

        const existing = await this.prisma.attendance.findFirst({
            where: {
                dojoId,
                userId,
                date: {
                    gte: startOfDay(day),
                    lte: endOfDay(day),
                },
            },
        })

        if (existing) {
            return this.prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    present,
                    takenById,
                },
            })
        }

        return this.prisma.attendance.create({
            data: {
                dojoId,
                userId,
                present,
                takenById,
                date: day,
            },
        })
    }

    async getAttendanceMetrics(dojoId: string) {
        // Todos los estudiantes del dojo
        const memberships = await this.prisma.dojoMembership.findMany({
            where: { dojoId },
            include: { user: true },
        })

        // Total de clases del dojo
        const totalClasses = await this.prisma.attendance.count({
            where: { dojoId },
        })

        const results = []

        for (const membership of memberships) {
            const attendedClasses = await this.prisma.attendance.count({
                where: { dojoId, userId: membership.userId, present: true },
            })

            results.push({
                userId: membership.user.id,
                userName: membership.user.name,
                dojoId,
                dojoName: membership.dojoId, // o membership.dojo.name si incluyes dojo
                totalClasses,
                attendedClasses,
                attendancePercentage: totalClasses
                    ? Math.round((attendedClasses / totalClasses) * 100)
                    : 0,
            })
        }

        return results
    }
}
