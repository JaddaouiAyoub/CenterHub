const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  console.log('--- Database Connection Test ---');
  
  try {
    // Test Enum accessibility in values FIRST
    const enums = require('@prisma/client');
    if (enums.EvaluationType) {
      console.log('✅ EvaluationType enum found in @prisma/client package');
      console.log('📍 Available types:', Object.values(enums.EvaluationType));
    } else if (enums.$Enums && enums.$Enums.EvaluationType) {
      console.log('✅ EvaluationType found under $Enums namespace');
      console.log('📍 Available types:', Object.values(enums.$Enums.EvaluationType));
    } else {
      console.log('❌ EvaluationType NOT found in @prisma/client');
    }

    // Try to connect and run a simple query
    console.log('📡 Connecting to database...');
    const userCount = await prisma.user.count();
    console.log('✅ Connection successful!');
    console.log(`📊 Number of users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
