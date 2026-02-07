import { PrismaClient, DojoRole, UserRole, ContentType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  /**
   * =======================
   * STYLES (sí tienen unique)
   * =======================
   */
  const shotokan = await prisma.style.upsert({
    where: { name: 'Shotokan' },
    update: {},
    create: {
      name: 'Shotokan',
      description: 'Estilo tradicional de karate japonés',
    },
  })

  /**
   * =======================
   * GRADE
   * =======================
   */
  let white = await prisma.grade.findFirst({
    where: {
      styleId: shotokan.id,
      order: 1,
    },
  })

  if (!white) {
    white = await prisma.grade.create({
      data: {
        name: 'Cinturón Blanco',
        order: 1,
        styleId: shotokan.id,
      },
    })
  }

  /**
   * =======================
   * DOJO
   * =======================
   */
  let dojo = await prisma.dojo.findFirst({
    where: { name: 'Dojo Central' },
  })

  if (!dojo) {
    dojo = await prisma.dojo.create({
      data: {
        name: 'Dojo Central',
        styleId: shotokan.id,
      },
    })
  }

  /**
   * =======================
   * USERS (email es unique)
   * =======================
   */
  const sensei = await prisma.user.upsert({
    where: { email: 'sensei@dojo.cl' },
    update: {},
    create: {
      email: 'sensei@dojo.cl',
      password: 'hashed',
      name: 'Sensei Juan',
      role: UserRole.PROFESSOR,
    },
  })

  const alumno = await prisma.user.upsert({
    where: { email: 'alumno@dojo.cl' },
    update: {},
    create: {
      email: 'alumno@dojo.cl',
      password: 'hashed',
      name: 'Pedro',
      role: UserRole.STUDENT,
    },
  })

  /**
   * =======================
   * DOJO MEMBERSHIPS (unique compuesto OK)
   * =======================
   */
  await prisma.dojoMembership.upsert({
    where: {
      userId_dojoId: {
        userId: sensei.id,
        dojoId: dojo.id,
      },
    },
    update: { role: DojoRole.PROFESSOR },
    create: {
      userId: sensei.id,
      dojoId: dojo.id,
      role: DojoRole.PROFESSOR,
    },
  })

  await prisma.dojoMembership.upsert({
    where: {
      userId_dojoId: {
        userId: alumno.id,
        dojoId: dojo.id,
      },
    },
    update: { role: DojoRole.STUDENT },
    create: {
      userId: alumno.id,
      dojoId: dojo.id,
      role: DojoRole.STUDENT,
    },
  })

  /**
   * =======================
   * CONTENT
   * =======================
   */
  const existingContent = await prisma.content.findFirst({
    where: { title: 'Historia del Shotokan' },
  })

  if (!existingContent) {
    await prisma.content.create({
      data: {
        title: 'Historia del Shotokan',
        type: ContentType.PDF,
        styleId: shotokan.id,
        gradeId: white.id,
        createdById: sensei.id,
      },
    })
  }

  console.log('✅ Seed ejecutado correctamente')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
