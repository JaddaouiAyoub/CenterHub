const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Prisma properties:", Object.keys(prisma).filter(k => !k.startsWith("_")));
  process.exit(0);
}

main();
