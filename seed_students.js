const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('/Boo2648', 10);

  const students = [
    { code: '2299999', email: '2299999@student.hcmus.edu.vn', name: 'Student 2299999' },
    { code: '2266666', email: '2266666@student.hcmus.edu.vn', name: 'Student 2266666' },
  ];

  for (const student of students) {
    const existing = await prisma.user.findUnique({ where: { email: student.email } });
    if (existing) {
      console.log(`User ${student.email} already exists.`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: student.email,
        password: passwordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            studentCode: student.code,
            fullName: student.name,
          },
        },
      },
    });
    console.log(`Created student ${student.code}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
