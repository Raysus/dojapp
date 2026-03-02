import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UserRole } from '@prisma/client'

@Injectable()
export class DojoContentsService {
    constructor(private prisma: PrismaService) { }

    async getContentForDojo(dojoId: string, contentId: string, userId: string, userRole: UserRole) {
        const dojo = await this.prisma.dojo.findUnique({
            where: { id: dojoId },
            select: { id: true, styleId: true },
        })
        if (!dojo) throw new NotFoundException('Dojo no existe')

        const content = await this.prisma.content.findFirst({
            where: { id: contentId, styleId: dojo.styleId },
            include: { grade: true },
        })
        if (!content) throw new NotFoundException('Contenido no existe')

        if (userRole === UserRole.ADMIN) return content

        if (userRole === UserRole.PROFESSOR) return content

        const membership = await this.prisma.dojoMembership.findUnique({
            where: { userId_dojoId: { userId, dojoId } },
            select: { role: true },
        })
        if (!membership) throw new ForbiddenException('No perteneces a este dojo')

        if (!content.gradeId) return content

        const studentGrade = await this.prisma.studentGrade.findUnique({
            where: { userId_dojoId: { userId, dojoId } },
            include: { grade: true },
        })
        if (!studentGrade?.grade) throw new ForbiddenException('Alumno sin grado asignado')

        const contentGrade = await this.prisma.grade.findUnique({
            where: { id: content.gradeId },
            select: { order: true },
        })
        if (!contentGrade) throw new ForbiddenException('Grado del contenido inválido')

        if (contentGrade.order <= studentGrade.grade.order) return content

        throw new ForbiddenException('Contenido no disponible para tu grado')
    }
}