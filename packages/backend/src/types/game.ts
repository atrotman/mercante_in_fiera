export interface AuctionState {
  status: 'inactive' | 'active' | 'completed'
  currentCard: Card | null
  currentBid: number
  highestBidder: string | null
  timeRemaining: number
  remainingCards: Card[]
}

export interface WinningCardsState {
  cards: Card[]
  prizes: number[]
} 