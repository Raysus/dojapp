import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async createProfessor(data: {
    email: string;
    password: string;
    name: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: UserRole.PROFESSOR,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        dojoMemberships: {
          select: {
            role: true,
            dojo: { select: { id: true, name: true } },
          },
          orderBy: { dojo: { name: 'asc' } },
        },
        studentGrades: {
          select: {
            dojoId: true,
            grade: { select: { id: true, name: true, order: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const gradeByDojo = new Map(
      user.studentGrades.map(sg => [sg.dojoId, sg.grade]),
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      dojos: user.dojoMemberships.map(m => ({
        id: m.dojo.id,
        name: m.dojo.name,
        role: m.role,
        grade: gradeByDojo.get(m.dojo.id) ?? null,
      })),
    };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const name = dto.name?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (name === undefined && email === undefined) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    if (name !== undefined && name.length < 2) {
      throw new BadRequestException('El nombre debe tener al menos 2 caracteres');
    }

    if (email) {
      const taken = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) throw new BadRequestException('Ese correo ya está en uso');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.authService.issueTokensForUser(userId);
    return { user: updated, ...tokens };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('Contraseña actual incorrecta');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    // Keep current session: revoke other refresh tokens only after caller
    // optionally calls logoutOthers. Here we just confirm password change.
    return { ok: true };
  }

  async logoutOtherSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.authService.issueTokensForUser(userId);
    return { ok: true, ...tokens };
  }
}
