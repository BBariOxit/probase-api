import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { cohortFromStudentCode } from '../src/users/student-code.util';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

// Same driver adapter PrismaService uses — Prisma 7 has no implicit datasource.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Every account here is admin-provisioned, matching how real accounts are
// created — there is no self-registration path for ADMIN, so without this seed
// the API has no way to produce its own first administrator.
const ADMIN_EMAIL = (
  process.env.SEED_ADMIN_EMAIL ?? 'admin@probase.dev'
).toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';

// A fixture for building the forced-password-change screen. Bulk import mails
// a random temp password, which is useless while developing a UI — this account
// carries mustChangePassword with a password you already know.
// The address is the student code plus the domain, as it is at the university:
// cohort is derived from those first two digits, so a fixture like sv001@ would
// not survive its own validation rules.
const DEMO_STUDENTS = [
  {
    code: '2266666',
    email: '2266666@dlu.edu.vn',
    password: 'Bao2648@',
    name: 'Nguyễn Văn A',
  },
  {
    code: '2277777',
    email: '2277777@dlu.edu.vn',
    password: 'Bao2648@',
    name: 'Phạm Thị B',
  },
  {
    code: '2288888',
    email: '2288888@dlu.edu.vn',
    password: 'Bao2648@',
    name: 'Lê Văn C',
  },
  {
    code: '2299999',
    email: '2299999@dlu.edu.vn',
    password: 'Bao2648@',
    name: 'Trần Văn D',
  },
];

// Two lecturers, not one. A single lecturer cannot exercise the rule that
// matters most on topics — that owning a topic, rather than merely holding the
// LECTURER role, is what permits editing it — and the council and reviewer
// features later need more than one lecturer to assign anyway.
const DEMO_LECTURER_PASSWORD =
  process.env.SEED_LECTURER_PASSWORD ?? 'Lecturer@123';
const DEMO_LECTURERS = [
  {
    email: 'gv001@probase.dev',
    lecturerCode: 'GV001',
    fullName: 'Trần Thị B',
    academicTitle: 'TS',
    researchInterests: 'Kỹ thuật phần mềm, kiểm thử tự động',
  },
  {
    email: 'gv002@probase.dev',
    lecturerCode: 'GV002',
    fullName: 'Lê Văn C',
    academicTitle: 'ThS',
    researchInterests: 'Hệ thống thông tin, cơ sở dữ liệu',
  },
];

// Chuyên ngành — a flat list. Swap these for your faculty's real ones.
const MAJORS = [
  { code: 'KTPM', name: 'Kỹ thuật Phần mềm' },
  { code: 'HTTT', name: 'Hệ thống Thông tin' },
  { code: 'KHMT', name: 'Khoa học Máy tính' },
  { code: 'TTNT', name: 'Trí tuệ Nhân tạo' },
  { code: 'MMT', name: 'Mạng máy tính và Truyền thông' },
  { code: 'ATTT', name: 'An toàn Thông tin' },
];

const PROJECT_TYPES = [
  { code: 'DACS', name: 'Đồ án Cơ sở' },
  { code: 'DACN', name: 'Đồ án Chuyên ngành' },
  { code: 'DATN', name: 'Đồ án Tốt nghiệp' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY_MS);

async function main() {
  console.log('Seeding…');

  // Master data first — bulk import resolves majorCode against this table.
  const majorIdByCode = new Map<string, number>();
  for (const major of MAJORS) {
    const saved = await prisma.major.upsert({
      where: { code: major.code },
      create: major,
      update: { name: major.name },
    });
    majorIdByCode.set(saved.code, saved.id);
  }
  console.log(`  majors: ${MAJORS.length}`);

  for (const type of PROJECT_TYPES) {
    await prisma.projectType.upsert({
      where: { code: type.code },
      create: type,
      update: { name: type.name },
    });
  }
  console.log(`  project types: ${PROJECT_TYPES.length}`);

  // Dates are relative to the run so the registration window is open right
  // now — a seeded semester that closed last month tests nothing.
  const month = new Date().getMonth();
  const academicYear =
    month >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const semesterCode = `HK1-${academicYear}-${academicYear + 1}`;

  const semester = await prisma.semester.upsert({
    where: { code: semesterCode },
    create: {
      code: semesterCode,
      name: `Học kỳ 1 năm học ${academicYear}-${academicYear + 1}`,
      startDate: daysFromNow(-30),
      endDate: daysFromNow(120),
      gradeSubmissionDeadline: daysFromNow(110),
      isActive: true,
    },
    update: { isActive: true },
  });
  console.log(`  semester: ${semesterCode}`);

  // One round per kind of project, which is the announcement the faculty
  // actually puts out: Cơ sở to the third-years, Chuyên ngành to the fourth,
  // Tốt nghiệp to the fifth, counted back from the academic year so the fixture
  // stays right whenever it is run. The demo student's code puts them in the
  // Chuyên ngành cohort.
  //
  // Phase is set explicitly rather than left to its PREP default: the windows
  // below are deliberately open right now, and a round sitting in PREP would
  // refuse every registration while claiming to be open. The two have to agree,
  // and only one of them can be the default.
  const ROUNDS: { code: string; yearsBack: number; closesInDays: number }[] = [
    { code: 'DACS', yearsBack: 3, closesInDays: 21 },
    { code: 'DACN', yearsBack: 4, closesInDays: 21 },
    // Deliberately on its own schedule. Final-year projects run to a different
    // calendar in real faculties, and a fixture where all three rounds close on
    // the same day would never exercise the reason rounds exist.
    { code: 'DATN', yearsBack: 5, closesInDays: 14 },
  ];

  for (const { code, yearsBack, closesInDays } of ROUNDS) {
    const projectType = await prisma.projectType.findUniqueOrThrow({
      where: { code },
    });

    const round = await prisma.registrationRound.upsert({
      where: {
        semesterId_projectTypeId: {
          semesterId: semester.id,
          projectTypeId: projectType.id,
        },
      },
      create: {
        semesterId: semester.id,
        projectTypeId: projectType.id,
        registrationStart: daysFromNow(-7),
        registrationEnd: daysFromNow(closesInDays),
        phase: 'OPEN',
      },
      // Reseeding a round that has already moved on would otherwise drag it back
      // to OPEN and unlock allocation work someone had finished.
      update: {},
    });

    await prisma.roundEligibility.deleteMany({ where: { roundId: round.id } });
    await prisma.roundEligibility.create({
      data: { roundId: round.id, cohort: String(academicYear - yearsBack + 1) },
    });
  }
  console.log(`  rounds: ${ROUNDS.length} (one per kind of project)`);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: 'ADMIN',
      // The bootstrap admin is the one account nobody can hand a temp
      // password to, so it starts ready to use.
      mustChangePassword: false,
    },
    update: {},
  });
  console.log(`  admin: ${admin.email}`);

  // Created the same way UsersService does it: account and profile together,
  // never a profile-less User.
  for (const student of DEMO_STUDENTS) {
    await prisma.user.upsert({
      where: { email: student.email },
      create: {
        email: student.email,
        password: await bcrypt.hash(student.password, 10),
        role: 'STUDENT',
        mustChangePassword: true,
        studentProfile: {
          create: {
            studentCode: student.code,
            fullName: student.name,
            class: 'CTK46',
            // Derived from the code, exactly as the import and create paths do
            // it — the seed must not be the one place that sets it by hand.
            cohort: cohortFromStudentCode(student.code)!,
            majorId: majorIdByCode.get('KTPM'),
          },
        },
      },
      update: {},
    });
    console.log(`  demo student: ${student.email} (mustChangePassword)`);
  }

  // Ready to use rather than mustChangePassword: these exist to drive the
  // topic screens, and a forced password change on every reseed only gets in
  // the way of that.
  const lecturerPassword = await bcrypt.hash(DEMO_LECTURER_PASSWORD, 10);
  for (const lecturer of DEMO_LECTURERS) {
    const { email, ...profile } = lecturer;
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        password: lecturerPassword,
        role: 'LECTURER',
        mustChangePassword: false,
        lecturerProfile: { create: profile },
      },
      update: {},
    });
  }
  console.log(`  demo lecturers: ${DEMO_LECTURERS.length}`);

  // Seed topics for lecturer gv001@probase.dev (Trần Thị B)
  const lecturerUser = await prisma.user.findUnique({
    where: { email: 'gv001@probase.dev' },
    include: { lecturerProfile: true },
  });

  if (lecturerUser?.lecturerProfile) {
    // Prevent endlessly creating these on every re-seed
    await prisma.topic.deleteMany({
      where: {
        lecturerId: lecturerUser.lecturerProfile.id,
        semesterId: semester.id,
      },
    });

    const rounds = await prisma.registrationRound.findMany({
      where: { semesterId: semester.id },
      include: { projectType: true },
    });

    const topicDataByRound: Record<
      string,
      Array<{ title: string; description: string; expectedOutcomes: string }>
    > = {
      DACS: [
        {
          title: 'Xây dựng website quản lý thư viện cá nhân',
          description:
            'Sinh viên sẽ xây dựng một website cơ bản cho phép người dùng thêm, sửa, xóa và tìm kiếm sách trong thư viện cá nhân của họ. Yêu cầu giao diện thân thiện và dễ sử dụng.',
          expectedOutcomes:
            'Source code website, báo cáo quá trình thực hiện và các chức năng cơ bản hoạt động tốt.',
        },
        {
          title: 'Phát triển ứng dụng di động ghi chú công việc (To-do app)',
          description:
            'Ứng dụng di động đơn giản giúp người dùng quản lý các công việc hàng ngày, đặt lịch nhắc nhở và đánh dấu hoàn thành. Phù hợp để làm quen với lập trình di động.',
          expectedOutcomes:
            'File cài đặt ứng dụng (APK hoặc tương đương), mã nguồn và tài liệu mô tả.',
        },
      ],
      DACN: [
        {
          title: 'Hệ thống gợi ý sản phẩm dựa trên hành vi người dùng',
          description:
            'Nghiên cứu và áp dụng các thuật toán Machine Learning cơ bản để xây dựng hệ thống gợi ý sản phẩm cho một trang thương mại điện tử mô phỏng.',
          expectedOutcomes:
            'Báo cáo nghiên cứu thuật toán, API hệ thống gợi ý và demo tích hợp trên web.',
        },
        {
          title: 'Ứng dụng điểm danh sinh viên bằng nhận diện khuôn mặt',
          description:
            'Phát triển một ứng dụng hỗ trợ điểm danh tự động thông qua camera, sử dụng các thư viện nhận diện khuôn mặt (Computer Vision).',
          expectedOutcomes:
            'Hệ thống điểm danh hoàn chỉnh, báo cáo đánh giá độ chính xác của mô hình.',
        },
      ],
      DATN: [
        {
          title: 'Nền tảng học trực tuyến tích hợp AI đánh giá năng lực',
          description:
            'Xây dựng một nền tảng E-learning toàn diện. Tích hợp thêm AI để tự động phân tích và đưa ra lộ trình học tập cá nhân hóa dựa trên kết quả bài test của học viên.',
          expectedOutcomes:
            'Hệ thống web/app hoàn chỉnh (Frontend & Backend), mô hình AI phân tích, báo cáo đồ án tốt nghiệp.',
        },
        {
          title:
            'Hệ thống quản lý chuỗi cung ứng thông minh sử dụng Blockchain',
          description:
            'Nghiên cứu ứng dụng công nghệ Blockchain (Smart Contracts) vào việc truy xuất nguồn gốc và quản lý chuỗi cung ứng hàng hóa một cách minh bạch và an toàn.',
          expectedOutcomes:
            'Smart contract đã deploy trên testnet, DApp giao diện người dùng, báo cáo nghiên cứu chuyên sâu.',
        },
      ],
    };

    let topicCount = 0;
    for (const round of rounds) {
      const typeCode = round.projectType.code;
      const tDataList = topicDataByRound[typeCode] || [];

      for (const tData of tDataList) {
        await prisma.topic.create({
          data: {
            title: tData.title,
            description: tData.description,
            expectedOutcomes: tData.expectedOutcomes,
            maxStudents: typeCode === 'DATN' ? 2 : 3,
            status: 'PENDING',
            semesterId: semester.id,
            roundId: round.id,
            lecturerId: lecturerUser.lecturerProfile.id,
          },
        });
        topicCount++;
      }
    }
    console.log(
      `  demo topics: ${topicCount} (by ${lecturerUser.lecturerProfile.fullName})`,
    );
  }

  console.log('\nLogin with:');
  console.log(`  ADMIN     ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  for (const student of DEMO_STUDENTS) {
    console.log(`  STUDENT   ${student.email} / ${student.password}`);
  }
  for (const { email } of DEMO_LECTURERS) {
    console.log(`  LECTURER  ${email} / ${DEMO_LECTURER_PASSWORD}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
