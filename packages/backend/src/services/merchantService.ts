import { PrismaClient, Card, Game } from '@prisma/client'
import { shuffleCards, calculatePrizes } from '../utils/cardUtils'

interface DistributionResult {
  playerCards: { playerId: string; cards: Card[] }[]
  remainingCards: Card[]
}

export class MerchantService {
  constructor(private prisma: PrismaClient) {}

  async setupGame(gameId: string): Promise<Game> {
    // 1. Get game and verify it exists
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })
    
    if (!game) throw new Error('Game not found')
    if (game.status !== 'waiting') throw new Error('Game already started')
    
    // 2. Get and shuffle both decks
    const cards = await this.prisma.card.findMany()
    const deck1 = shuffleCards([...cards])
    const deck2 = shuffleCards([...cards])
    
    // 3. Select winner cards
    const winningCards = deck1.splice(0, game.winnerCards)
    
    // 4. Calculate prize distribution
    const prizeDistribution = calculatePrizes(game.prizePool, game.winnerCards)
    
    // 5. Update game state
    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'dealing',
        deck1: deck1,
        deck2: deck2,
        winningCards: {
          cards: winningCards,
          prizes: prizeDistribution
        },
        auctionState: {
          status: 'inactive',
          currentCard: null,
          currentBid: 0,
          highestBidder: null,
          remainingCards: []
        }
      }
    })
  }

  async distributeCards(gameId: string): Promise<DistributionResult> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })
    
    if (!game || !game.deck2) throw new Error('Game not found or not initialized')
    
    const deck = game.deck2 as Card[]
    const playerCount = game.players.length
    const cardsPerPlayer = Math.floor(deck.length / playerCount)
    const remainingCards = deck.slice(playerCount * cardsPerPlayer)
    
    // Distribute base cards to players
    const playerCards = game.players.map(player => ({
      playerId: player.id,
      cards: deck.slice(
        game.players.indexOf(player) * cardsPerPlayer,
        (game.players.indexOf(player) + 1) * cardsPerPlayer
      )
    }))
    
    return {
      playerCards,
      remainingCards
    }
  }

  async handleRemainingCards(
    gameId: string,
    remainingCards: Card[],
    auctionTimeoutMs: number = 30000
  ) {
    // Start with auction phase
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        auctionState: {
          status: 'active',
          remainingCards: remainingCards,
          currentCard: remainingCards[0],
          currentBid: 0,
          highestBidder: null,
          timeRemaining: auctionTimeoutMs
        }
      }
    })
    
    // Auction logic will be handled by separate methods
    // After auction, remaining cards will be distributed randomly
  }

  async placeBid(gameId: string, playerId: string, bidAmount: number): Promise<Game> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })

    if (!game) throw new Error('Game not found')
    
    const auctionState = game.auctionState as AuctionState
    if (!auctionState || auctionState.status !== 'active') {
      throw new Error('No active auction')
    }

    // Validate bid
    if (bidAmount <= auctionState.currentBid) {
      throw new Error('Bid must be higher than current bid')
    }

    // Update auction state
    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        auctionState: {
          ...auctionState,
          currentBid: bidAmount,
          highestBidder: playerId,
          timeRemaining: 30000 // Reset timer when new bid is placed
        }
      }
    })
  }

  async completeCurrentAuction(gameId: string): Promise<Game> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })

    if (!game) throw new Error('Game not found')
    
    const auctionState = game.auctionState as AuctionState
    if (!auctionState || auctionState.status !== 'active') {
      throw new Error('No active auction')
    }

    if (auctionState.highestBidder) {
      // Someone won the auction - assign card to winner
      await this.prisma.playerCard.create({
        data: {
          gameId,
          playerId: auctionState.highestBidder,
          cardId: auctionState.currentCard!.id
        }
      })
    } else {
      // No bids - add card to list for random distribution
      auctionState.remainingCards.push(auctionState.currentCard!)
    }

    // Move to next card or finish auction phase
    const nextCard = auctionState.remainingCards[0]
    if (nextCard) {
      // Start next card auction
      return this.prisma.game.update({
        where: { id: gameId },
        data: {
          auctionState: {
            ...auctionState,
            currentCard: nextCard,
            currentBid: 0,
            highestBidder: null,
            timeRemaining: 30000,
            remainingCards: auctionState.remainingCards.slice(1)
          }
        }
      })
    } else {
      // No more cards to auction - distribute remaining cards randomly
      return this.distributeRemainingCardsRandomly(gameId, auctionState.remainingCards)
    }
  }

  private async distributeRemainingCardsRandomly(gameId: string, remainingCards: Card[]): Promise<Game> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })

    if (!game) throw new Error('Game not found')

    // Get current card distribution
    const playerCards = await this.prisma.playerCard.groupBy({
      by: ['playerId'],
      where: { gameId },
      _count: true
    })

    // Shuffle remaining cards
    const shuffledCards = shuffleCards(remainingCards)
    
    // Distribute remaining cards ensuring no player gets more than 1 extra
    const cardAssignments = []
    for (const card of shuffledCards) {
      // Find eligible players (those with fewest extra cards)
      const eligiblePlayers = game.players.filter(player => {
        const playerCardCount = playerCards.find(pc => pc.playerId === player.id)?._count ?? 0
        return playerCardCount === Math.min(...playerCards.map(pc => pc._count))
      })

      // Randomly select one eligible player
      const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]
      
      cardAssignments.push({
        gameId,
        playerId: randomPlayer.id,
        cardId: card.id
      })

      // Update count for next iteration
      const playerCardCount = playerCards.find(pc => pc.playerId === randomPlayer.id)
      if (playerCardCount) {
        playerCardCount._count++
      } else {
        playerCards.push({ playerId: randomPlayer.id, _count: 1 })
      }
    }

    // Create all card assignments in a transaction
    await this.prisma.$transaction([
      this.prisma.playerCard.createMany({
        data: cardAssignments
      }),
      this.prisma.game.update({
        where: { id: gameId },
        data: {
          auctionState: {
            status: 'completed',
            currentCard: null,
            currentBid: 0,
            highestBidder: null,
            timeRemaining: 0,
            remainingCards: []
          },
          status: 'active' // Move to active game phase
        }
      })
    ])

    return this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    })!
  }
} 