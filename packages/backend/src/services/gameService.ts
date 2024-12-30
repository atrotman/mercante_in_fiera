import { PrismaClient, Game, User, Card } from '@prisma/client'
import { shuffleCards } from '../utils/cardUtils'

export class GameService {
  constructor(private prisma: PrismaClient) {}

  async initializeGame(gameId: string) {
    // 1. Get all cards from database
    const cards = await this.prisma.card.findMany()
    
    // 2. Create two shuffled decks
    const deck1 = shuffleCards([...cards])
    const deck2 = shuffleCards([...cards])
    
    // 3. Select winner cards from deck1
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })
    
    if (!game) throw new Error('Game not found')
    
    const winningCards = deck1.splice(0, game.winnerCards)
    
    // 4. Update game with initial state
    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'dealing',
        deck1: deck1,
        deck2: deck2,
        winningCards: winningCards,
        merchant: game.players[0].id // First player is merchant by default
      }
    })
  }

  async dealCards(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })
    
    if (!game || !game.deck2) throw new Error('Game not found or not initialized')
    
    const deck = game.deck2 as Card[]
    const playerCount = game.players.length
    const cardsPerPlayer = Math.floor(deck.length / playerCount)
    
    // Deal cards to players
    const playerCards = []
    for (let i = 0; i < playerCount; i++) {
      const playerHand = deck.splice(0, cardsPerPlayer)
      playerCards.push(...playerHand.map(card => ({
        gameId,
        playerId: game.players[i].id,
        cardId: card.id
      })))
    }
    
    // Create player cards and update game status
    await this.prisma.$transaction([
      this.prisma.playerCard.createMany({
        data: playerCards
      }),
      this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'active',
          deck2: deck // Remaining cards (if any)
        }
      })
    ])
  }

  // Add more game logic methods...
} 