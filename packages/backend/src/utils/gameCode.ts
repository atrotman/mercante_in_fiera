import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function generateUniqueGameCode(): Promise<string> {
  const length = 6
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  
  while (true) {
    let code = ''
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Check if code already exists
    const existingGame = await prisma.game.findUnique({
      where: { code }
    })
    
    if (!existingGame) {
      return code
    }
  }
} 