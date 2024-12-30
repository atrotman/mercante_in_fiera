import { PrismaClient, Game, User, Card } from '@prisma/client'
import { MerchantService } from '../merchantService'
import { mockDeep, MockProxy } from 'jest-mock-extended'

describe('MerchantService', () => {
  let prisma: MockProxy<PrismaClient>
  let merchantService: MerchantService
  
  // Mock data
  const mockGame: Game = {
    id: 'game-1',
    code: 'ABC123',
    isPublic: false,
    status: 'waiting',
    entranceFee: 10,
    winnerCards: 5,
    prizePool: 100,
    maxPlayers: 6,
    deck1: null,
    deck2: null,
    winningCards: null,
    currentTurn: 0,
    revealedCards: null,
    auctionState: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockPlayers: User[] = [
    { id: 'player-1', nickname: 'Player1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'player-2', nickname: 'Player2', createdAt: new Date(), updatedAt: new Date() },
    { id: 'player-3', nickname: 'Player3', createdAt: new Date(), updatedAt: new Date() }
  ]

  const mockCards: Card[] = Array.from({ length: 40 }, (_, i) => ({
    id: `card-${i + 1}`,
    name: `Card ${i + 1}`,
    italianName: `Carta ${i + 1}`,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>()
    merchantService = new MerchantService(prisma)
  })

  describe('setupGame', () => {
    it('should initialize game state correctly', async () => {
      // Setup mocks
      prisma.game.findUnique.mockResolvedValue({ ...mockGame, players: mockPlayers })
      prisma.card.findMany.mockResolvedValue(mockCards)
      prisma.game.update.mockImplementation(async (args) => ({
        ...mockGame,
        ...args.data,
        players: mockPlayers
      }))

      // Execute
      const result = await merchantService.setupGame('game-1')

      // Verify
      expect(result.status).toBe('dealing')
      expect(result.deck1).toBeDefined()
      expect(result.deck2).toBeDefined()
      expect(result.winningCards).toBeDefined()
      const winningCardsState = result.winningCards as any
      expect(winningCardsState.cards.length).toBe(5)
      expect(winningCardsState.prizes.length).toBe(5)
    })

    it('should throw error if game not found', async () => {
      prisma.game.findUnique.mockResolvedValue(null)
      await expect(merchantService.setupGame('invalid-id')).rejects.toThrow('Game not found')
    })
  })

  describe('distributeCards', () => {
    it('should distribute cards evenly', async () => {
      // Setup
      const gameWithDecks = {
        ...mockGame,
        players: mockPlayers,
        deck2: mockCards
      }
      prisma.game.findUnique.mockResolvedValue(gameWithDecks)

      // Execute
      const result = await merchantService.distributeCards('game-1')

      // Verify
      expect(result.playerCards.length).toBe(mockPlayers.length)
      const cardsPerPlayer = Math.floor(mockCards.length / mockPlayers.length)
      result.playerCards.forEach(playerCards => {
        expect(playerCards.cards.length).toBe(cardsPerPlayer)
      })
    })
  })

  describe('placeBid', () => {
    it('should accept valid bid', async () => {
      // Setup
      const gameWithAuction = {
        ...mockGame,
        players: mockPlayers,
        auctionState: {
          status: 'active',
          currentCard: mockCards[0],
          currentBid: 10,
          highestBidder: null,
          timeRemaining: 30000,
          remainingCards: mockCards.slice(1)
        }
      }
      prisma.game.findUnique.mockResolvedValue(gameWithAuction)
      prisma.game.update.mockImplementation(async (args) => ({
        ...gameWithAuction,
        ...args.data
      }))

      // Execute
      const result = await merchantService.placeBid('game-1', 'player-1', 20)

      // Verify
      expect(result.auctionState.currentBid).toBe(20)
      expect(result.auctionState.highestBidder).toBe('player-1')
    })

    it('should reject lower bid', async () => {
      // Setup
      const gameWithAuction = {
        ...mockGame,
        auctionState: {
          status: 'active',
          currentBid: 20,
          highestBidder: 'player-2'
        }
      }
      prisma.game.findUnique.mockResolvedValue(gameWithAuction)

      // Execute & Verify
      await expect(
        merchantService.placeBid('game-1', 'player-1', 10)
      ).rejects.toThrow('Bid must be higher than current bid')
    })
  })

  describe('distributeRemainingCardsRandomly', () => {
    it('should distribute remaining cards fairly', async () => {
      // Setup
      const remainingCards = mockCards.slice(0, 4) // 4 remaining cards
      prisma.game.findUnique.mockResolvedValue({ ...mockGame, players: mockPlayers })
      prisma.playerCard.groupBy.mockResolvedValue([
        { playerId: 'player-1', _count: 13 },
        { playerId: 'player-2', _count: 13 },
        { playerId: 'player-3', _count: 13 }
      ])
      prisma.game.update.mockImplementation(async (args) => ({
        ...mockGame,
        ...args.data
      }))

      // Execute
      await merchantService['distributeRemainingCardsRandomly']('game-1', remainingCards)

      // Verify
      expect(prisma.playerCard.createMany).toHaveBeenCalled()
      const createManyCall = prisma.playerCard.createMany.mock.calls[0][0]
      const cardAssignments = createManyCall.data
      
      // Check that no player got more than 1 extra card
      const assignmentCounts = {}
      cardAssignments.forEach(assignment => {
        assignmentCounts[assignment.playerId] = (assignmentCounts[assignment.playerId] || 0) + 1
      })
      Object.values(assignmentCounts).forEach(count => {
        expect(count).toBeLessThanOrEqual(2) // Max 1 extra card
      })
    })
  })
}) 