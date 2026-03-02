import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { DojoRole, UserRole } from '@prisma/client'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  health() {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    }
  }

  async stats() {
    const [
      users,
      dojos,
      contents,
      memberships,
      studentContents,
      completedStudentContents,
      attendances,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.dojo.count(),
      this.prisma.content.count(),
      this.prisma.dojoMembership.count(),
      this.prisma.studentContent.count(),
      this.prisma.studentContent.count({ where: { completed: true } }),
      this.prisma.attendance.count(),
    ])

    return {
      users,
      dojos,
      contents,
      memberships,
      studentContents,
      completedStudentContents,
      attendances,
    }
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        dojoMemberships: {
          select: {
            dojoId: true,
            role: true,
            dojo: { select: { name: true } },
          },
        },
        studentGrades: {
          select: {
            dojoId: true,
            gradeId: true,
            grade: { select: { name: true, order: true } },
          },
        },
      },
      take: 200,
    })
  }

  async listDojos() {
    return this.prisma.dojo.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, styleId: true },
      take: 200,
    })
  }

  async listGrades(dojoId: string) {
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    })
    if (!dojo) throw new BadRequestException('Dojo no existe')

    return this.prisma.grade.findMany({
      where: { styleId: dojo.styleId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true },
    })
  }

  async createContent(
    dojoId: string,
    adminUserId: string,
    body: {
      title: string
      type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK'
      url?: string
      body?: string
      gradeId?: string
    },
  ) {
    const dojo = await this.prisma.dojo.findUnique({
      where: { id: dojoId },
      select: { styleId: true },
    })
    if (!dojo) throw new BadRequestException('Dojo no existe')

    if (body.gradeId) {
      const grade = await this.prisma.grade.findUnique({
        where: { id: body.gradeId },
        select: { styleId: true },
      })
      if (!grade || grade.styleId !== dojo.styleId) {
        throw new BadRequestException('Grado no pertenece al dojo')
      }
    }

    return this.prisma.content.create({
      data: {
        title: body.title,
        type: body.type as any,
        url: body.url,
        body: body.body,
        styleId: dojo.styleId,
        gradeId: body.gradeId ?? null,
        createdById: adminUserId,
      },
    })
  }

  async createUser(body: {
    email: string
    password: string
    name: string
    role: UserRole
    dojoId?: string
    dojoRole?: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR'
    gradeId?: string
  }) {
    const { email, password, name, role, dojoId, dojoRole, gradeId } = body

    if (!email || !password || !name || !role) {
      throw new BadRequestException('Faltan campos requeridos')
    }

    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) throw new BadRequestException('Email ya existe')

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
        role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    if (dojoId && dojoRole) {
      await this.assignUserToDojo(user.id, { dojoId, dojoRole, gradeId })
    }

    return user
  }

  async assignUserToDojo(
    userId: string,
    body: {
      dojoId: string
      dojoRole: 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR'
      gradeId?: string
    },
  ) {
    const { dojoId, dojoRole, gradeId } = body
    if (!dojoId || !dojoRole) throw new BadRequestException('Faltan campos requeridos')

    const [user, dojo] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.prisma.dojo.findUnique({ where: { id: dojoId }, select: { id: true, styleId: true } }),
    ])
    if (!user) throw new BadRequestException('Usuario no existe')
    if (!dojo) throw new BadRequestException('Dojo no existe')

    const roleEnum = DojoRole[dojoRole]
    if (!roleEnum) throw new BadRequestException('dojoRole inválido')

    await this.prisma.dojoMembership.upsert({
      where: { userId_dojoId: { userId, dojoId } },
      update: { role: roleEnum },
      create: { userId, dojoId, role: roleEnum },
    })

    if (roleEnum === DojoRole.STUDENT) {
      if (gradeId) {
        const grade = await this.prisma.grade.findUnique({
          where: { id: gradeId },
          select: { id: true, styleId: true },
        })
        if (!grade || grade.styleId !== dojo.styleId) {
          throw new BadRequestException('Grado no pertenece al dojo')
        }

        await this.prisma.studentGrade.upsert({
          where: { userId_dojoId: { userId, dojoId } },
          update: { gradeId },
          create: { userId, dojoId, gradeId },
        })
      }
    } else {
      await this.prisma.studentGrade.deleteMany({
        where: { userId, dojoId },
      })
    }

    return { ok: true }
  }
}
