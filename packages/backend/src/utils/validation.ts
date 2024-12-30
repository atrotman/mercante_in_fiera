import { z } from 'zod'

// Game settings validation
export const GameSettings = z.object({
  entranceFee: z.number().min(0).default(0),
  winnerCards: z.number().min(1).max(7).default(5),
  maxPlayers: z.number().min(2).max(10).default(6)
})

// Nickname validation
export const NicknameSchema = z.string()
  .min(2, 'Nickname must be at least 2 characters')
  .max(20, 'Nickname must be at most 20 characters')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Nickname can only contain letters, numbers, hyphens, and underscores')

// Game code validation
export const GameCodeSchema = z.string()
  .length(6, 'Game code must be exactly 6 characters')
  .regex(/^[A-Z0-9]+$/, 'Game code can only contain uppercase letters and numbers') 