const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyCards() {
  try {
    const cardCount = await prisma.card.count()
    console.log(`\n=== Card Database Verification ===`)
    console.log(`Total cards in database: ${cardCount}`)
    
    const cards = await prisma.card.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        italianName: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('\nCards in database:')
    console.log('----------------------------------------')
    cards.forEach(card => {
      console.log(`
Name: ${card.name}
Italian: ${card.italianName}
Image: ${card.imageUrl || 'Not set'}
ID: ${card.id}
Created: ${card.createdAt.toLocaleString()}
----------------------------------------`)
    })
    
    // Verify we have all 40 cards
    if (cardCount !== 40) {
      console.log('\n⚠️  WARNING: Expected 40 cards, but found', cardCount)
    } else {
      console.log('\n✅ Success: Found all 40 cards!')
    }

    // Print summary
    console.log('\nSummary:')
    console.log(`- Total cards: ${cardCount}`)
    console.log(`- Cards with images: ${cards.filter(c => c.imageUrl).length}`)
    console.log(`- Cards without images: ${cards.filter(c => !c.imageUrl).length}`)
    
  } catch (error) {
    console.error('Error verifying cards:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCards() 