import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    'postgresql://probase:probase123@localhost:5432/probase?schema=public',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const refStudent = await prisma.studentProfile.findUnique({
    where: { studentCode: '2212345' },
  });
  if (!refStudent) {
    console.error('Reference student 2212345 not found!');
    return;
  }
  const targetCohort = refStudent.cohort;
  const targetMajor = refStudent.majorId;
  console.log(`Setting cohort to ${targetCohort} and major to ${targetMajor}`);

  const studentsToFix = ['2299999', '2266666_dlu'];

  for (const code of studentsToFix) {
    await prisma.studentProfile.update({
      where: { studentCode: code },
      data: { cohort: targetCohort, majorId: targetMajor },
    });
    console.log(`Updated cohort and major for ${code}`);
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
