import { io, Socket } from 'socket.io-client'
import { ServerToClientEvents, ClientToServerEvents } from '../../../backend/src/types/socket'

export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor() {
    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    this.setupListeners()
  }

  connect(gameId: string, nickname: string) {
    this.socket.auth = { gameId, nickname }
    this.socket.connect()
  }

  disconnect() {
    this.socket.disconnect()
  }

  private setupListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to game server')
      this.emit('connectionStatus', { connected: true })
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server')
      this.emit('connectionStatus', { connected: false })
    })

    // Game events
    this.socket.on('playerJoined', (data) => {
      this.emit('playerJoined', data)
    })

    this.socket.on('playerLeft', (data) => {
      this.emit('playerLeft', data)
    })

    this.socket.on('gameStarted', (data) => {
      this.emit('gameStarted', data)
    })

    this.socket.on('gameStateUpdated', (data) => {
      this.emit('gameStateUpdated', data)
    })

    this.socket.on('turnStarted', (data) => {
      this.emit('turnStarted', data)
    })

    // Card events
    this.socket.on('cardsDealt', (data) => {
      this.emit('cardsDealt', data)
    })

    this.socket.on('cardRevealed', (data) => {
      this.emit('cardRevealed', data)
    })

    this.socket.on('cardEliminated', (data) => {
      this.emit('cardEliminated', data)
    })

    // Auction events
    this.socket.on('auctionStarted', (data) => {
      this.emit('auctionStarted', data)
    })

    this.socket.on('auctionEnded', (data) => {
      this.emit('auctionEnded', data)
    })

    this.socket.on('timerUpdated', (data) => {
      this.emit('timerUpdated', data)
    })

    this.socket.on('bidPlaced', (data) => {
      this.emit('bidPlaced', data)
    })

    // Trade events
    this.socket.on('tradeOffered', (data) => {
      this.emit('tradeOffered', data)
    })

    this.socket.on('tradeAccepted', (data) => {
      this.emit('tradeAccepted', data)
    })

    this.socket.on('tradeRejected', (data) => {
      this.emit('tradeRejected', data)
    })

    this.socket.on('tradeCancelled', (data) => {
      this.emit('tradeCancelled', data)
    })

    // Game end events
    this.socket.on('winnerCardRevealed', (data) => {
      this.emit('winnerCardRevealed', data)
    })

    this.socket.on('gameEnded', (data) => {
      this.emit('gameEnded', data)
    })

    this.socket.on('error', (data) => {
      console.error('Socket error:', data.message)
      this.emit('error', data)
    })
  }

  // Event emitters
  startGame() {
    this.socket.emit('startGame')
  }

  readyToStart() {
    this.socket.emit('readyToStart')
  }

  placeBid(amount: number) {
    this.socket.emit('placeBid', { amount })
  }

  offerTrade(toPlayer: string, offeredCards: string[], requestedCards: string[]) {
    this.socket.emit('offerTrade', { toPlayer, offeredCards, requestedCards })
  }

  acceptTrade(tradeId: string) {
    this.socket.emit('acceptTrade', { tradeId })
  }

  rejectTrade(tradeId: string) {
    this.socket.emit('rejectTrade', { tradeId })
  }

  cancelTrade(tradeId: string) {
    this.socket.emit('cancelTrade', { tradeId })
  }

  leaveGame() {
    this.socket.emit('leaveGame')
  }

  // Event handling
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)?.push(handler)
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
} 