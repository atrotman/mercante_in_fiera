import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cards = [
  { name: 'The King', italianName: 'Il Re' },
  { name: 'The Queen', italianName: 'La Regina' },
  { name: 'The Merchant', italianName: 'Il Mercante' },
  { name: 'The Sailor', italianName: 'Il Marinaio' },
  { name: 'The Knight', italianName: 'Il Cavaliere' },
  { name: 'The Farmer', italianName: 'Il Contadino' },
  { name: 'The Beggar', italianName: 'Il Mendicante' },
  { name: 'The Fool', italianName: 'Il Matto' },
  { name: 'The Witch', italianName: 'La Strega' },
  { name: 'The Monk', italianName: 'Il Monaco' },
  { name: 'The Dog', italianName: 'Il Cane' },
  { name: 'The Cat', italianName: 'Il Gatto' },
  { name: 'The Horse', italianName: 'Il Cavallo' },
  { name: 'The Pig', italianName: 'Il Maiale' },
  { name: 'The Chicken', italianName: 'La Gallina' },
  { name: 'The Fish', italianName: 'Il Pesce' },
  { name: 'The Grapes', italianName: 'L\'Uva' },
  { name: 'The Barrel', italianName: 'La Botte' },
  { name: 'The Key', italianName: 'La Chiave' },
  { name: 'The Sword', italianName: 'La Spada' },
  { name: 'The Treasure Chest', italianName: 'Il Forziere' },
  { name: 'The Candle', italianName: 'La Candela' },
  { name: 'The Moon', italianName: 'La Luna' },
  { name: 'The Sun', italianName: 'Il Sole' },
  { name: 'The Star', italianName: 'La Stella' },
  { name: 'The Tower', italianName: 'La Torre' },
  { name: 'The Ship', italianName: 'La Nave' },
  { name: 'The Windmill', italianName: 'Il Mulino' },
  { name: 'The Heart', italianName: 'Il Cuore' },
  { name: 'The Clover', italianName: 'Il Trifoglio' },
  { name: 'The Ring', italianName: 'L\'Anello' },
  { name: 'The Bell', italianName: 'La Campana' },
  { name: 'The Mask', italianName: 'La Maschera' },
  { name: 'The Harlequin', italianName: 'L\'Arlecchino' },
  { name: 'The Devil', italianName: 'Il Diavolo' },
  { name: 'The Angel', italianName: 'L\'Angelo' },
  { name: 'The Rose', italianName: 'La Rosa' },
  { name: 'The Butterfly', italianName: 'La Farfalla' },
  { name: 'The Rainbow', italianName: 'L\'Arcobaleno' },
  { name: 'The Goblet', italianName: 'Il Calice' }
];

async function main() {
  console.log('Start seeding...');
  
  try {
    // Use createMany instead of upsert
    await prisma.card.createMany({
      data: cards,
      skipDuplicates: true, // This will skip any duplicates
    });
    
    const cardCount = await prisma.card.count();
    console.log(`Seeding finished. ${cardCount} cards created.`);
  } catch (error) {
    console.error('Error seeding database:', error);
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