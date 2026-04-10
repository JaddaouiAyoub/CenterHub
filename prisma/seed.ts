const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prismaSeed = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("Emptying database...");
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

  console.log("Creating basic types...");
  // 1. Subjects
  const math = await prismaSeed.subject.create({ data: { name: "Mathématiques" } });
  const physics = await prismaSeed.subject.create({ data: { name: "Physique-Chimie" } });
  const french = await prismaSeed.subject.create({ data: { name: "Français" } });
  const english = await prismaSeed.subject.create({ data: { name: "Anglais" } });

  // 2. Classes
  const bacPro = await prismaSeed.class.create({ data: { name: "Bac Pro" } });
  const second = await prismaSeed.class.create({ data: { name: "2ème Année" } });
  const thirdClass = await prismaSeed.class.create({ data: { name: "3ème Année" } });

  console.log("Creating administrative users...");
  // 3. Admin & Secretary
  await prismaSeed.user.create({
    data: { name: "Directeur", email: "admin@example.com", password: hashedPassword, role: "ADMIN" }
  });

  await prismaSeed.user.create({
    data: { name: "Secrétaire Fatima", email: "secretary@example.com", password: hashedPassword, role: "SECRETARY" }
  });

  console.log("Creating teachers...");
  // 4. Teachers
  const teacherAhmed = await prismaSeed.user.create({
    data: {
      name: "Prof. Ahmed",
      email: "ahmed@example.com",
      password: hashedPassword,
      role: "TEACHER",
      teacherProfile: { create: { specialization: "Mathématiques", bio: "Expert en analyse" } }
    },
    include: { teacherProfile: true }
  });

  const teacherZineb = await prismaSeed.user.create({
    data: {
      name: "Prof. Zineb",
      email: "zineb@example.com",
      password: hashedPassword,
      role: "TEACHER",
      teacherProfile: { create: { specialization: "Physique", bio: "Passionnée par les sciences" } }
    },
    include: { teacherProfile: true }
  });

  console.log("Creating students and parents...");
  // 5. Parent
  const parentFull = await prismaSeed.user.create({
    data: { name: "M. Alami", email: "parent@example.com", password: hashedPassword, role: "PARENT" }
  });

  // 6. Students
  const studentSami = await prismaSeed.user.create({
    data: {
      name: "Sami Alami",
      email: "student1@example.com",
      password: hashedPassword,
      role: "STUDENT",
      studentProfile: {
        create: {
          dateOfBirth: new Date("2008-03-12"),
          classes: { connect: { id: second.id } },
          subjects: { connect: [{ id: math.id }, { id: physics.id }] }
        }
      }
    },
    include: { studentProfile: true }
  });

  const studentLina = await prismaSeed.user.create({
    data: {
      name: "Lina Bennani",
      email: "student2@example.com",
      password: hashedPassword,
      role: "STUDENT",
      studentProfile: {
        create: {
          dateOfBirth: new Date("2009-08-24"),
          classes: { connect: { id: bacPro.id } },
          subjects: { connect: [{ id: french.id }, { id: math.id }] }
        }
      }
    },
    include: { studentProfile: true }
  });

  console.log("Creating courses...");
  // 7. Weekly Courses
  const mathWeekly = await prismaSeed.course.create({
    data: {
      name: "Mathématiques Hebdos",
      subjectId: math.id,
      classId: second.id,
      teacherId: teacherAhmed.teacherProfile.id,
      day: 1, // Monday
      startTime: "09:00",
      endTime: "11:00",
      meetingLink: "https://zoom.us/j/math-hebdo",
      recurrence: "WEEKLY"
    }
  });

  const physicsWeekly = await prismaSeed.course.create({
    data: {
      name: "Labo Physique",
      subjectId: physics.id,
      classId: second.id,
      teacherId: teacherZineb.teacherProfile.id,
      day: 3, // Wednesday
      startTime: "14:00",
      endTime: "16:00",
      recurrence: "WEEKLY"
    }
  });

  // 8. One-off Courses (Date specific)
  const today = new Date();
  const nextFriday = new Date();
  nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
  nextFriday.setHours(10, 0, 0, 0);

  const mathRevision = await prismaSeed.course.create({
    data: {
      name: "Révision Examen Math",
      subjectId: math.id,
      classId: second.id,
      teacherId: teacherAhmed.teacherProfile.id,
      day: nextFriday.getDay(),
      startTime: "10:00",
      endTime: "12:00",
      recurrence: "ONCE",
      specificDate: nextFriday
    }
  });

  console.log("Creating resources and activities...");
  // 9. Resources
  await prismaSeed.resource.create({
    data: { name: "Polycopié Dérivées", url: "https://example.com/math1.pdf", type: "PDF", courseId: mathWeekly.id }
  });

  await prismaSeed.resource.create({
    data: { name: "Schéma Circuit", url: "https://example.com/circuit.png", type: "IMAGE", courseId: physicsWeekly.id }
  });

  // 10. Attendance
  await prismaSeed.attendance.create({
    data: { studentId: studentSami.studentProfile.id, courseId: mathWeekly.id, date: new Date(), status: "PRESENT" }
  });

  // 11. Payments
  await prismaSeed.payment.create({
    data: {
      studentId: studentSami.studentProfile.id,
      amount: 450,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      status: "PAID",
      method: "CASH",
      courses: { connect: { id: mathWeekly.id } }
    }
  });

  await prismaSeed.payment.create({
    data: {
      studentId: studentLina.studentProfile.id,
      amount: 450,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      status: "PENDING",
      method: "TRANSFER"
    }
  });

  console.log("🌱 Seed completed with consistent data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaSeed.$disconnect();
  });