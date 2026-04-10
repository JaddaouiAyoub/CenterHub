const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prismaSeed = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clean data (ordre important à cause des relations)
  await prismaSeed.payment.deleteMany();
  await prismaSeed.attendance.deleteMany();
  await prismaSeed.resource.deleteMany();
  await prismaSeed.course.deleteMany();
  await prismaSeed.enrollment.deleteMany();
  await prismaSeed.studentProfile.deleteMany();
  await prismaSeed.teacherProfile.deleteMany();
  await prismaSeed.subject.deleteMany();
  await prismaSeed.class.deleteMany();
  await prismaSeed.user.deleteMany();

  // 1. Subjects
  const math = await prismaSeed.subject.create({
    data: { name: "Mathématiques" },
  });

  const physics = await prismaSeed.subject.create({
    data: { name: "Physique-Chimie" },
  });

  // 2. Classes
  const classA = await prismaSeed.class.create({
    data: { name: "Bac Pro" },
  });

  const classB = await prismaSeed.class.create({
    data: { name: "2ème Année" },
  });

  // 3. Users (Admin + Secretary)
  const admin = await prismaSeed.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const secretary = await prismaSeed.user.create({
    data: {
      name: "Secrétaire",
      email: "secretary@example.com",
      password: hashedPassword,
      role: "SECRETARY",
    },
  });

  // 4. Teacher
  const teacherUser = await prismaSeed.user.create({
    data: {
      name: "Prof. Ahmed",
      email: "teacher@example.com",
      password: hashedPassword,
      role: "TEACHER",
      teacherProfile: {
        create: {
          specialization: "Mathématiques",
          bio: "Expert en analyse",
        },
      },
    },
    include: {
      teacherProfile: true,
    },
  });

  // 5. Student
  const studentUser = await prismaSeed.user.create({
    data: {
      name: "Sami Alami",
      email: "student1@example.com",
      password: hashedPassword,
      role: "STUDENT",
      studentProfile: {
        create: {
          dateOfBirth: new Date("2008-03-12"),
        },
      },
    },
    include: {
      studentProfile: true,
    },
  });

  // 6. Link student to class (many-to-many)
  await prismaSeed.studentProfile.update({
    where: { id: studentUser.studentProfile.id },
    data: {
      classes: {
        connect: { id: classA.id },
      },
    },
  });

  // 7. Course
  const course = await prismaSeed.course.create({
    data: {
      name: "Session Math 1",
      subjectId: math.id,
      classId: classA.id,
      teacherId: teacherUser.teacherProfile.id,
      day: 1, // Monday
      startTime: "09:00",
      endTime: "11:00",
      meetingLink: "https://zoom.us/j/123456",
    },
  });

  // 8. Resource (NEW)
  await prismaSeed.resource.create({
    data: {
      name: "Cours PDF Math",
      url: "https://example.com/math.pdf",
      type: "PDF",
      courseId: course.id,
    },
  });

  // 9. Enrollment
  await prismaSeed.enrollment.create({
    data: {
      studentId: studentUser.studentProfile.id,
      active: true,
    },
  });

  // 10. Attendance
  await prismaSeed.attendance.create({
    data: {
      studentId: studentUser.studentProfile.id,
      courseId: course.id,
      date: new Date(),
      status: "PRESENT",
    },
  });

  // 11. Payment
  await prismaSeed.payment.create({
    data: {
      studentId: studentUser.studentProfile.id,
      amount: 500,
      month: 4,
      year: 2026,
      status: "PAID",
      method: "CASH",
      courses: {
        connect: { id: course.id },
      },
    },
  });

  console.log("🌱 Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaSeed.$disconnect();
  });