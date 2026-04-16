const prismaClient = require('@prisma/client');

console.log('EvaluationType in @prisma/client:', !!prismaClient.EvaluationType);
if (prismaClient.EvaluationType) {
  console.log('Values:', Object.keys(prismaClient.EvaluationType));
}
