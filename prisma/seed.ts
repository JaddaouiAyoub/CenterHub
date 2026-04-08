const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prismaSeed = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Deleting existing users
  await prismaSeed.user.deleteMany();

  const users = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
    {
      name: "Teacher User",
      email: "teacher@example.com",
      password: hashedPassword,
      role: "TEACHER",
    },
    {
      name: "Parent User",
      email: "parent@example.com",
      password: hashedPassword,
      role: "PARENT",
    },
    {
      name: "Secretary User",
      email: "secretary@example.com",
      password: hashedPassword,
      role: "SECRETARY",
    },
  ];

  for (const user of users) {
    await prismaSeed.user.create({
      data: user,
    });
  }

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
