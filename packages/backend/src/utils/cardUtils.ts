import { Card } from '@prisma/client'

export function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function calculatePrizes(totalPrize: number, winnerCount: number): number[] {
  // Default distribution percentages
  const distributions = [
    [100], // 1 winner
    [60, 40], // 2 winners
    [50, 30, 20], // 3 winners
    [40, 30, 20, 10], // 4 winners
    [35, 25, 20, 10, 10], // 5 winners
    [30, 25, 20, 10, 10, 5], // 6 winners
    [30, 20, 15, 10, 10, 10, 5] // 7 winners
  ]

  const distribution = distributions[winnerCount - 1]
  return distribution.map(percent => (totalPrize * percent) / 100)
} 