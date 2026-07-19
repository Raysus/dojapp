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
    // 🔐 defensa en profundidad (aunque el controller ya tenga guards)
    await this.authz.assertInstructorInDojo(takenById, dojoId)
    await this.authz.assertStudentInDojo(userId, dojoId)

    const day = startOfDay(date ?? new Date())

    return this.prisma.attendance.upsert({
      where: {
        dojoId_userId_date: {
          dojoId,
          userId,
          date: day,
        },
      },
      update: {
        present,
        takenById,
      },
      create: {
        dojoId,
        userId,
        present,
        takenById,
        date: day,
      },
    })
  }

  async markAttendanceBatch({
    dojoId,
    takenById,
    items,
  }: {
    dojoId: string
    takenById: string
    items: Array<{ userId: string; present: boolean; date?: Date }>
  }) {
    await this.authz.assertInstructorInDojo(takenById, dojoId)

    for (const item of items) {
      await this.authz.assertStudentInDojo(item.userId, dojoId)
    }

    return this.prisma.$transaction(
      items.map((item) => {
        const day = startOfDay(item.date ?? new Date())
        return this.prisma.attendance.upsert({
          where: {
            dojoId_userId_date: {
              dojoId,
              userId: item.userId,
              date: day,
            },
          },
          update: {
            present: item.present,
            takenById,
          },
          create: {
            dojoId,
            userId: item.userId,
            present: item.present,
            takenById,
            date: day,
          },
        })
      }),
    )
  }

  async getAttendanceForDate(dojoId: string, requestedById: string, date?: string) {
    await this.authz.assertInstructorInDojo(requestedById, dojoId)

    const day = startOfDay(date ? new Date(date) : new Date())

    const memberships = await this.prisma.dojoMembership.findMany({
      where: { dojoId, role: DojoRole.STUDENT },
      include: {
        user: { select: { id: true, name: true } },
      },
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
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { user: { name: 'asc' } },
    })

    // Calcula "cantidad de clases" como cantidad de días distintos donde se tomó asistencia.
    // Como guardamos la fecha normalizada a startOfDay(), esto es consistente.
    const [distinctDays, attendedByUser] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ['date'],
        where: { dojoId },
      }),
      this.prisma.attendance.groupBy({
        by: ['userId'],
        where: { dojoId, present: true },
        _count: { _all: true },
      }),
    ])
    const totalClasses = distinctDays.length
    const attendedMap = new Map(
      attendedByUser.map(row => [row.userId, row._count._all]),
    )

    const metrics: AttendanceMetric[] = memberships.map(m => {
      const attendedClasses = attendedMap.get(m.userId) ?? 0
      const attendancePercentage = totalClasses
        ? Math.round((attendedClasses / totalClasses) * 100)
        : 0

      return {
        userId: m.userId,
        userName: m.user.name,
        dojoId,
        dojoName: dojo?.name ?? '',
        totalClasses,
        attendedClasses,
        attendancePercentage,
      }
    })

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
