const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prismaSeed = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clean data
  await prismaSeed.payment.deleteMany();
  await prismaSeed.attendance.deleteMany();
  await prismaSeed.enrollment.deleteMany();
  await prismaSeed.course.deleteMany();
  await prismaSeed.studentProfile.deleteMany();
  await prismaSeed.teacherProfile.deleteMany();
  await prismaSeed.subject.deleteMany();
  await prismaSeed.class.deleteMany();
  await prismaSeed.user.deleteMany();

  // 1. Create Subjects
  const math = await prismaSeed.subject.create({ data: { name: "Mathématiques" } });
  const physics = await prismaSeed.subject.create({ data: { name: "Physique-Chimie" } });

  // 2. Create Classes
  const classA = await prismaSeed.class.create({ data: { name: "Bac Pro" } });
  const classB = await prismaSeed.class.create({ data: { name: "2ème Année" } });

  // 3. Create Admin & Secretary
  await prismaSeed.user.create({
    data: { name: "Admin", email: "admin@example.com", password: hashedPassword, role: "ADMIN" }
  });
  await prismaSeed.user.create({
    data: { name: "Secrétaire", email: "secretary@example.com", password: hashedPassword, role: "SECRETARY" }
  });

  // 4. Create Teacher
  const teacher = await prismaSeed.user.create({
    data: {
      name: "Prof. Ahmed",
      email: "teacher@example.com",
      password: hashedPassword,
      role: "TEACHER",
      teacherProfile: { create: { specialization: "Mathématiques", bio: "Expert en analyse" } }
    },
    include: { teacherProfile: true }
  });

  // 5. Create Students
  const s1 = await prismaSeed.user.create({
    data: {
      name: "Sami Alami",
      email: "student1@example.com",
      password: hashedPassword,
      role: "STUDENT",
      studentProfile: { create: { classId: classA.id, dateOfBirth: new Date("2008-03-12") } }
    },
    include: { studentProfile: true }
  });

  // 6. Create Course
  await prismaSeed.course.create({
    data: {
      name: "Session Math 1",
      subjectId: math.id,
      classId: classA.id,
      teacherId: teacher.teacherProfile.id,
      day: 1, // Lundi
      startTime: "09:00",
      endTime: "11:00"
    }
  });

  console.log("Seeding finished.");
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaSeed.$disconnect();
  });
