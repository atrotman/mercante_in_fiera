import { PrismaClient, Game, Card, PlayerCard } from '@prisma/client'

interface GameState {
  game: Game & {
    players: any[]
    playerCards: (PlayerCard & { card: Card })[]
  }
  auctionState?: any
  currentTurn?: number
  lastAction?: {
    type: string
    data: any
    timestamp: number
  }
}

export class GameStateManager {
  private gameStates = new Map<string, GameState>()
  private stateHistory = new Map<string, GameState[]>()
  private maxHistoryLength = 10

  constructor(private prisma: PrismaClient) {}

  async saveGameState(gameId: string, partialState?: Partial<GameState>) {
    try {
      // Fetch current game state from database
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

      // Create new state
      const newState: GameState = {
        game,
        auctionState: game.auctionState,
        currentTurn: game.currentTurn,
        ...partialState
      }

      // Save to memory
      this.gameStates.set(gameId, newState)

      // Update history
      let history = this.stateHistory.get(gameId) || []
      history.push(newState)
      if (history.length > this.maxHistoryLength) {
        history = history.slice(-this.maxHistoryLength)
      }
      this.stateHistory.set(gameId, history)

      return newState
    } catch (error) {
      console.error('Failed to save game state:', error)
      throw error
    }
  }

  async recoverGameState(gameId: string): Promise<GameState | null> {
    try {
      // First try memory state
      const memoryState = this.gameStates.get(gameId)
      if (memoryState) return memoryState

      // If not in memory, reconstruct from database
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        include: {
          players: true,
          playerCards: {
            include: { card: true }
          }
        }
      })

      if (!game) return null

      const newState: GameState = {
        game,
        auctionState: game.auctionState,
        currentTurn: game.currentTurn
      }

      this.gameStates.set(gameId, newState)
      return newState
    } catch (error) {
      console.error('Failed to recover game state:', error)
      return null
    }
  }

  async rollbackToLastState(gameId: string): Promise<GameState | null> {
    const history = this.stateHistory.get(gameId)
    if (!history || history.length < 2) return null

    // Remove current state
    history.pop()
    // Get previous state
    const previousState = history[history.length - 1]

    // Update database to match previous state
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: previousState.game.status,
        currentTurn: previousState.currentTurn,
        auctionState: previousState.auctionState,
        deck1: previousState.game.deck1,
        deck2: previousState.game.deck2,
        winningCards: previousState.game.winningCards
      }
    })

    this.gameStates.set(gameId, previousState)
    return previousState
  }

  async validateGameState(gameId: string): Promise<boolean> {
    const state = await this.recoverGameState(gameId)
    if (!state) return false

    try {
      // Validate game integrity
      const validations = [
        this.validatePlayerCards(state),
        this.validateAuctionState(state),
        this.validateTurnState(state)
      ]

      return (await Promise.all(validations)).every(v => v)
    } catch (error) {
      console.error('Game state validation failed:', error)
      return false
    }
  }

  private async validatePlayerCards(state: GameState): Promise<boolean> {
    // Check if all players have valid card counts
    const { game } = state
    const cardsPerPlayer = Math.floor(40 / game.players.length)
    
    for (const player of game.players) {
      const playerCards = game.playerCards.filter(pc => pc.playerId === player.id)
      if (playerCards.length < cardsPerPlayer) {
        return false
      }
    }
    return true
  }

  private validateAuctionState(state: GameState): boolean {
    if (!state.auctionState) return true
    
    const { auctionState } = state
    if (auctionState.status === 'active') {
      return (
        auctionState.currentCard != null &&
        auctionState.timeRemaining > 0 &&
        auctionState.currentBid >= 0
      )
    }
    return true
  }

  private validateTurnState(state: GameState): boolean {
    const { game } = state
    return (
      game.currentTurn >= 0 &&
      game.status !== 'waiting' &&
      ['dealing', 'active', 'completed'].includes(game.status)
    )
  }
} 