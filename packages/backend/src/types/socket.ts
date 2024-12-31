import { Server as SocketServer } from 'socket.io'
import { Socket } from 'socket.io-client'
import { Game, Card } from '@prisma/client'

export interface ServerToClientEvents {
  playerJoined: (data: { nickname: string }) => void
  playerLeft: (data: { nickname: string }) => void
  gameStarted: (data: { game: Game }) => void
  bidPlaced: (data: { nickname: string; amount: number }) => void
  error: (data: { message: string }) => void

  gameStateUpdated: (data: { game: Game }) => void
  turnStarted: (data: { currentPlayer: string }) => void
  
  cardsDealt: (data: { playerCards: Card[] }) => void
  cardRevealed: (data: { card: Card; isWinnerCard: boolean }) => void
  cardEliminated: (data: { card: Card }) => void
  
  auctionStarted: (data: { card: Card; timeRemaining: number }) => void
  auctionEnded: (data: { winner: string | null; card: Card }) => void
  timerUpdated: (data: { timeRemaining: number }) => void
  
  tradeOffered: (data: { 
    from: string
    to: string
    offeredCards: Card[]
    requestedCards: Card[]
  }) => void
  tradeAccepted: (data: { tradeId: string }) => void
  tradeRejected: (data: { tradeId: string }) => void
  tradeCancelled: (data: { tradeId: string }) => void
  
  winnerCardRevealed: (data: { 
    card: Card
    matchingPlayer: string | null
    prize: number 
  }) => void
  gameEnded: (data: { 
    winners: Array<{ 
      player: string
      prize: number
      card: Card 
    }> 
  }) => void
}

export interface ClientToServerEvents {
  startGame: () => void
  placeBid: (data: { amount: number }) => void

  readyToStart: () => void
  
  offerTrade: (data: {
    toPlayer: string
    offeredCards: string[]  // Card IDs
    requestedCards: string[] // Card IDs
  }) => void
  acceptTrade: (data: { tradeId: string }) => void
  rejectTrade: (data: { tradeId: string }) => void
  cancelTrade: (data: { tradeId: string }) => void
  
  leaveGame: () => void
  reconnect: (data: { gameId: string; nickname: string }) => void
}

export interface SocketData {
  gameId: string
  nickname: string
}

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>
export type GameServer = SocketServer<ClientToServerEvents, ServerToClientEvents> 