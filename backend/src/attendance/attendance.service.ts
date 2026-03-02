import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuthorizationService } from '../authorization/authorization.service'
import { startOfDay, endOfDay } from 'date-fns'
import { DojoRole } from '@prisma/client'


type AttendanceMetric = {
  userId: string
  userName: string
  dojoId: string
  dojoName: string
  totalClasses: number
  attendedClasses: number
  attendancePercentage: number
}


@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
  ) { }

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
    await this.authz.assertInstructorInDojo(takenById, dojoId)

    const day = startOfDay(date ?? new Date())

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
          date: day,
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

  async getAttendanceForDate(dojoId: string, requestedById: string, date?: string) {
    await this.authz.assertInstructorInDojo(requestedById, dojoId)

    const day = startOfDay(date ? new Date(date) : new Date())

    const memberships = await this.prisma.dojoMembership.findMany({
      where: { dojoId, role: DojoRole.STUDENT },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    })

    const records = await this.prisma.attendance.findMany({
      where: {
        dojoId,
        date: {
          gte: startOfDay(day),
          lte: endOfDay(day),
        },
      },
      select: { userId: true, present: true },
    })

    const byUserId = new Map(records.map(r => [r.userId, r.present]))

    return memberships.map(m => ({
      userId: m.userId,
      name: m.user.name,
      date: day.toISOString(),
      present: byUserId.get(m.userId) ?? false,
    }))
  }

  async getAttendanceMetrics(dojoId: string, requestedById: string) {
    await this.authz.assertInstructorInDojo(requestedById, dojoId)

    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { id: true, name: true },
    })

    const memberships = await this.prisma.dojoMembership.findMany({
      where: { dojoId, role: DojoRole.STUDENT },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
    })

    const distinctDays = await this.prisma.attendance.groupBy({
      by: ['date'],
      where: { dojoId },
    })
    const totalClasses = distinctDays.length

    const metrics: AttendanceMetric[] = []

    for (const m of memberships) {
      const attendedClasses = await this.prisma.attendance.count({
        where: {
          dojoId,
          userId: m.userId,
          present: true,
        },
      })

      const attendancePercentage = totalClasses
        ? Math.round((attendedClasses / totalClasses) * 100)
        : 0

      metrics.push({
        userId: m.userId,
        userName: m.user.name,
        dojoId,
        dojoName: dojo?.name ?? '',
        totalClasses,
        attendedClasses,
        attendancePercentage,
      })
    }

    const avgAttendancePercentage = metrics.length
      ? Math.round(metrics.reduce((acc, x) => acc + x.attendancePercentage, 0) / metrics.length)
      : 0

    return {
      dojoId,
      dojoName: dojo?.name ?? '',
      totalClasses,
      students: metrics,
      avgAttendancePercentage,
    }
  }
}
