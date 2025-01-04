import { PrismaClient, Game, Card, User } from '@prisma/client'

interface GameState {
  game: Game & {
    players: User[]
    playerCards: {
      playerId: string
      cards: Card[]
    }[]
  }
  auctionState?: {
    currentCard: Card | null
    currentBid: number
    highestBidder: string | null
    timeRemaining: number
  }
  revealedCards: Card[]
  currentTurn: number
  tradingEnabled: boolean
}

export class GameStateManager {
  private gameStates = new Map<string, GameState>()
  
  constructor(private prisma: PrismaClient) {}

  async saveGameState(gameId: string): Promise<void> {
    try {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        include: {
          players: true,
          playerCards: {
            include: { card: true }
          }
        }
      })

      if (!game) throw new Error('Game not found')

      // Organize player cards
      const playerCards = game.players.map(player => ({
        playerId: player.id,
        cards: game.playerCards
          .filter(pc => pc.playerId === player.id)
          .map(pc => pc.card)
      }))

      this.gameStates.set(gameId, {
        game: {
          ...game,
          playerCards
        },
        auctionState: game.auctionState as any,
        revealedCards: game.revealedCards as Card[] || [],
        currentTurn: game.currentTurn,
        tradingEnabled: game.status === 'active'
      })
    } catch (error) {
      console.error('Failed to save game state:', error)
      throw new Error('Failed to save game state')
    }
  }

  async recoverGameState(gameId: string): Promise<GameState> {
    // First try memory state
    const cachedState = this.gameStates.get(gameId)
    if (cachedState) return cachedState

    // If not in memory, rebuild from database
    try {
      await this.saveGameState(gameId)
      const recoveredState = this.gameStates.get(gameId)
      if (!recoveredState) throw new Error('Failed to recover game state')
      return recoveredState
    } catch (error) {
      console.error('Failed to recover game state:', error)
      throw new Error('Failed to recover game state')
    }
  }

  async validateGameState(gameId: string): Promise<boolean> {
    try {
      const state = await this.recoverGameState(gameId)
      
      // Validate player counts
      if (state.game.players.length < 2) return false
      
      // Validate card distribution
      const totalCards = state.game.playerCards.reduce(
        (sum, player) => sum + player.cards.length, 
        0
      )
      if (totalCards !== 40 - state.game.winnerCards) return false
      
      // Validate no duplicate cards
      const cardIds = state.game.playerCards
        .flatMap(player => player.cards)
        .map(card => card.id)
      const uniqueCardIds = new Set(cardIds)
      if (cardIds.length !== uniqueCardIds.size) return false

      return true
    } catch (error) {
      return false
    }
  }

  async handleStateError(gameId: string): Promise<void> {
    try {
      const isValid = await this.validateGameState(gameId)
      if (!isValid) {
        // Reset game to last known good state or restart
        await this.resetGameState(gameId)
      }
    } catch (error) {
      console.error('Failed to handle state error:', error)
      throw new Error('Failed to recover from error state')
    }
  }

  private async resetGameState(gameId: string): Promise<void> {
    try {
      // Reset to waiting state
      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'waiting',
          currentTurn: 0,
          deck1: null,
          deck2: null,
          winningCards: null,
          auctionState: null,
          revealedCards: null,
          playerCards: {
            deleteMany: {}
          }
        }
      })

      // Clear cached state
      this.gameStates.delete(gameId)
    } catch (error) {
      console.error('Failed to reset game state:', error)
      throw new Error('Failed to reset game state')
    }
  }
} 