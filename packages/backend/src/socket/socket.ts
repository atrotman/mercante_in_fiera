import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { PrismaClient } from '@prisma/client'
import { MerchantService } from '../services/merchantService'

const prisma = new PrismaClient()
const merchantService = new MerchantService(prisma)

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  // Middleware to handle connection
  io.use(async (socket, next) => {
    const { gameId, nickname } = socket.handshake.auth
    if (!gameId || !nickname) {
      return next(new Error('Authentication error'))
    }
    
    // Attach game and user info to socket
    socket.data.gameId = gameId
    socket.data.nickname = nickname
    next()
  })

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.data.nickname}`)
    
    // Join game room
    socket.join(socket.data.gameId)
    
    // Notify others in room
    socket.to(socket.data.gameId).emit('playerJoined', {
      nickname: socket.data.nickname
    })

    // Handle game events
    socket.on('startGame', async () => {
      try {
        const game = await merchantService.setupGame(socket.data.gameId)
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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.data.nickname}`)
      socket.to(socket.data.gameId).emit('playerLeft', {
        nickname: socket.data.nickname
      })
      const timer = auctionTimers.get(socket.data.gameId)
      if (timer) {
        clearInterval(timer)
        auctionTimers.delete(socket.data.gameId)
      }
    })
  })

  return io
} 