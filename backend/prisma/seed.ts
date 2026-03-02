import { PrismaClient, DojoRole, UserRole, ContentType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function getOrCreateStyle() {
  return prisma.style.upsert({
    where: { name: 'Shotokan' },
    update: {},
    create: {
      name: 'Shotokan',
      description: 'Estilo tradicional de karate japonés',
    },
  })
}

async function getOrCreateGrade(styleId: string, order: number, name: string) {
  const existing = await prisma.grade.findFirst({
    where: { styleId, order },
  })
  if (existing) return existing

  return prisma.grade.create({
    data: { styleId, order, name },
  })
}

async function getOrCreateDojo(styleId: string) {
  const existing = await prisma.dojo.findFirst({
    where: { name: 'Dojo Central' },
  })
  if (existing) return existing

  return prisma.dojo.create({
    data: { name: 'Dojo Central', styleId },
  })
}

async function upsertUser(email: string, name: string, role: UserRole, hashedPassword: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      // Importante: si ya existe, NO pisamos password para no “romper” usuarios creados antes.
      name,
      role,
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  })
}

async function upsertMembership(userId: string, dojoId: string, role: DojoRole) {
  return prisma.dojoMembership.upsert({
    where: { userId_dojoId: { userId, dojoId } },
    update: { role },
    create: { userId, dojoId, role },
  })
}

async function upsertStudentGrade(userId: string, dojoId: string, gradeId: string) {
  return prisma.studentGrade.upsert({
    where: { userId_dojoId: { userId, dojoId } },
    update: { gradeId },
    create: { userId, dojoId, gradeId },
  })
}

async function ensureContent(params: {
  title: string
  type: ContentType
  styleId: string
  createdById: string
  gradeId?: string
  url?: string | null
  body?: string | null
}) {
  const existing = await prisma.content.findFirst({
    where: {
      title: params.title,
      styleId: params.styleId,
      gradeId: params.gradeId ?? null,
    },
  })

  if (existing) return existing

  return prisma.content.create({
    data: {
      title: params.title,
      type: params.type,
      styleId: params.styleId,
      gradeId: params.gradeId,
      createdById: params.createdById,
      url: params.url ?? null,
      body: params.body ?? null,
    },
  })
}

async function main() {
  const DEFAULT_PASSWORD_HASH = await bcrypt.hash('123456', 10)

  // STYLE
  const shotokan = await getOrCreateStyle()

  // GRADES (sin @@unique, se maneja con findFirst)
  const white = await getOrCreateGrade(shotokan.id, 1, 'Cinturón Blanco')
  const yellow = await getOrCreateGrade(shotokan.id, 2, 'Cinturón Amarillo')

  // DOJO
  const dojo = await getOrCreateDojo(shotokan.id)

  // USERS
  const admin = await upsertUser('admin@dojo.cl', 'Administrador', UserRole.ADMIN, DEFAULT_PASSWORD_HASH)
  const sensei = await upsertUser('sensei@dojo.cl', 'Sensei Juan', UserRole.PROFESSOR, DEFAULT_PASSWORD_HASH)
  const alumno = await upsertUser('alumno@dojo.cl', 'Pedro', UserRole.STUDENT, DEFAULT_PASSWORD_HASH)

  // MEMBERSHIPS
  await upsertMembership(sensei.id, dojo.id, DojoRole.PROFESSOR)
  await upsertMembership(alumno.id, dojo.id, DojoRole.STUDENT)

  // STUDENT GRADE (ojo: userId, no studentId)
  await upsertStudentGrade(alumno.id, dojo.id, white.id)

  // OPTIONAL: UserStyle (si tu app lo usa)
  // Mantengo coherencia: alumno asociado al estilo + grade actual
  await prisma.userStyle.upsert({
    where: { userId_styleId: { userId: alumno.id, styleId: shotokan.id } },
    update: { gradeId: white.id },
    create: { userId: alumno.id, styleId: shotokan.id, gradeId: white.id },
  })

  // CONTENT (sin upsert por title, porque title no es unique)
  await ensureContent({
    title: 'Historia del Shotokan',
    type: ContentType.PDF,
    styleId: shotokan.id,
    gradeId: white.id,
    createdById: sensei.id,
  })

  await ensureContent({
    title: 'Kihon Básico',
    type: ContentType.VIDEO,
    styleId: shotokan.id,
    gradeId: white.id,
    createdById: sensei.id,
    url: 'https://example.com/kihon-basico',
  })

  await ensureContent({
    title: 'Etiquette del Dojo',
    type: ContentType.TEXT,
    styleId: shotokan.id,
    gradeId: yellow.id,
    createdById: sensei.id,
    body: 'Respeto, puntualidad y disciplina.',
  })

  console.log('✅ Seed ejecutado correctamente')
  console.log('🔐 Password para todos los usuarios: 123456')
  console.log('👤 admin@dojo.cl | sensei@dojo.cl | alumno@dojo.cl')
  console.log('🏫 Dojo:', dojo.name)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })