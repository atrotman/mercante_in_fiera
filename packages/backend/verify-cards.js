const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyCards() {
  try {
    const cardCount = await prisma.card.count()
    console.log(`Total cards in database: ${cardCount}`)
    
    const cards = await prisma.card.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('\nCards in database:')
    cards.forEach(card => {
      console.log(`- ${card.name} (${card.italianName})`)
    })
    
    // Verify we have all 40 cards
    if (cardCount !== 40) {
      console.log('\nWARNING: Expected 40 cards, but found', cardCount)
    } else {
      console.log('\nSuccess: Found all 40 cards!')
    }
  } catch (error) {
    console.error('Error verifying cards:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCards() 