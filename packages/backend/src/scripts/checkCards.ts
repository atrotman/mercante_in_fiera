import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCards() {
  try {
    console.log('Attempting to connect to database...');
    
    // First check if we can connect
    await prisma.$connect();
    console.log('Successfully connected to database.');
    
    // Try to count cards first
    const count = await prisma.card.count();
    console.log(`Current card count: ${count}`);
    
    if (count === 0) {
      console.log('No cards found in database. You may need to run the seed command again.');
      return;
    }
    
    const cards = await prisma.card.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\nCard Details:');
    console.log('------------');
    
    cards.forEach((card, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${card.name.padEnd(20)} | ${card.italianName}`);
    });
    
    console.log('\nDatabase Status:');
    console.log(`Expected Cards: 40`);
    console.log(`Actual Cards: ${cards.length}`);
    
    if (cards.length < 40) {
      console.log('\nWARNING: Some cards are missing!');
    }
    
  } catch (error) {
    console.error('Error occurred:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCards()
  .catch(console.error)
  .finally(() => process.exit(0)); 