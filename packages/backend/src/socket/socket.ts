import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { PrismaClient } from '@prisma/client'
import { MerchantService } from '../services/merchantService'
import { GameStateManager } from '../services/gameStateManager'

const prisma = new PrismaClient()
const merchantService = new MerchantService(prisma)
const gameStateManager = new GameStateManager(prisma)

// Track player sessions
const playerSessions = new Map<string, { gameId: string; socketId: string }>()

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    // Server-side reconnection settings
    pingTimeout: 10000,
    pingInterval: 5000
  })

  // Middleware to handle connection and reconnection
  io.use(async (socket, next) => {
    try {
      const { gameId, nickname, sessionId } = socket.handshake.auth

      if (!gameId || !nickname) {
        return next(new Error('Authentication error'))
      }

      // Check for existing session
      if (sessionId) {
        const existingSession = playerSessions.get(sessionId)
        if (existingSession && existingSession.gameId === gameId) {
          socket.data.sessionId = sessionId
          socket.data.isReconnect = true
        }
      }

      // Create new session if none exists
      if (!socket.data.sessionId) {
        const newSessionId = `${nickname}-${Date.now()}`
        socket.data.sessionId = newSessionId
        socket.data.isReconnect = false
      }

      socket.data.gameId = gameId
      socket.data.nickname = nickname
      next()
    } catch (error) {
      next(new Error('Session initialization failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Player ${socket.data.isReconnect ? 're' : ''}connected: ${socket.data.nickname}`)

    // Update session tracking
    playerSessions.set(socket.data.sessionId, {
      gameId: socket.data.gameId,
      socketId: socket.id
    })

    // Join game room
    socket.join(socket.data.gameId)

    // Handle reconnection
    if (socket.data.isReconnect) {
      handleReconnection(socket)
    } else {
      // Notify others of new player
      socket.to(socket.data.gameId).emit('playerJoined', {
        nickname: socket.data.nickname
      })
    }

    // Handle game events
    socket.on('startGame', async () => {
      try {
        const game = await merchantService.setupGame(socket.data.gameId)
        await gameStateManager.saveGameState(socket.data.gameId)
        io.to(socket.data.gameId).emit('gameStarted', { game })
      } catch (error) {
        socket.emit('error', { message: 'Failed to start game' })
      }
    })

    socket.on('placeBid', async (data: { amount: number }) => {
      try {
        const game = await merchantService.placeBid(
          socket.data.gameId,
          socket.id,
          data.amount
        )
        await gameStateManager.saveGameState(socket.data.gameId)
        io.to(socket.data.gameId).emit('bidPlaced', {
          nickname: socket.data.nickname,
          amount: data.amount
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to place bid' })
      }
    })

    socket.on('readyToStart', async () => {
      try {
        // Update player ready status
        // When all players ready, start the game
        const allReady = await checkAllPlayersReady(socket.data.gameId)
        if (allReady) {
          const game = await merchantService.setupGame(socket.data.gameId)
          io.to(socket.data.gameId).emit('gameStarted', { game })
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to ready up' })
      }
    })

    socket.on('offerTrade', async (data) => {
      try {
        // Validate trade offer
        // Create trade in database
        // Notify involved players
        io.to(data.toPlayer).emit('tradeOffered', {
          from: socket.data.nickname,
          to: data.toPlayer,
          offeredCards: data.offeredCards,
          requestedCards: data.requestedCards
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to offer trade' })
      }
    })

    // Add timer for auctions
    let auctionTimers = new Map<string, NodeJS.Timeout>()

    function startAuctionTimer(gameId: string, duration: number) {
      const timer = setInterval(() => {
        duration -= 1000
        io.to(gameId).emit('timerUpdated', { timeRemaining: duration })
        
        if (duration <= 0) {
          clearInterval(timer)
          auctionTimers.delete(gameId)
          merchantService.completeCurrentAuction(gameId)
        }
      }, 1000)
      
      auctionTimers.set(gameId, timer)
    }

    // Enhanced disconnect handling
    socket.on('disconnect', async (reason) => {
      console.log(`Player disconnected: ${socket.data.nickname}, reason: ${reason}`)

      // Keep session for potential reconnect
      setTimeout(() => {
        const session = playerSessions.get(socket.data.sessionId)
        if (session && session.socketId === socket.id) {
          playerSessions.delete(socket.data.sessionId)
          socket.to(socket.data.gameId).emit('playerLeft', {
            nickname: socket.data.nickname,
            permanent: true
          })
        }
      }, 60000) // Give 1 minute for reconnection

      // Notify others of temporary disconnect
      socket.to(socket.data.gameId).emit('playerLeft', {
        nickname: socket.data.nickname,
        permanent: false
      })
    })
  })

  return io
}

async function handleReconnection(socket: any) {
  try {
    // Try to recover game state
    const gameState = await gameStateManager.recoverGameState(socket.data.gameId)
    
    // Validate state
    const isValid = await gameStateManager.validateGameState(socket.data.gameId)
    if (!isValid) {
      await gameStateManager.handleStateError(socket.data.gameId)
      socket.emit('error', { 
        message: 'Game state was corrupted and has been reset' 
      })
      return
    }

    // Send full state to reconnected player
    socket.emit('gameStateUpdated', { game: gameState.game })

    // Restore specific state based on game phase
    if (gameState.auctionState?.currentCard) {
      socket.emit('auctionStarted', {
        card: gameState.auctionState.currentCard,
        timeRemaining: gameState.auctionState.timeRemaining
      })
    }

    // Send revealed cards
    gameState.revealedCards.forEach(card => {
      socket.emit('cardRevealed', { 
        card,
        isWinnerCard: false
      })
    })

    // Notify others of reconnection
    socket.to(socket.data.gameId).emit('playerReconnected', {
      nickname: socket.data.nickname
    })

  } catch (error) {
    console.error('Reconnection error:', error)
    socket.emit('error', { message: 'Failed to restore game state' })
  }
} 