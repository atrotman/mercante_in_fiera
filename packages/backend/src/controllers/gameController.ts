import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { generateUniqueGameCode } from '../utils/gameCode'
import { GameSettings, NicknameSchema, GameCodeSchema } from '../utils/validation'
import { z } from 'zod'

const prisma = new PrismaClient()

export const gameController = {
  // Create a private game
  async createPrivateGame(req: Request, res: Response) {
    try {
      const { nickname, entranceFee, winnerCards, maxPlayers } = req.body

      // Validate nickname
      const nicknameResult = NicknameSchema.safeParse(nickname)
      if (!nicknameResult.success) {
        return res.status(400).json({ error: nicknameResult.error.errors[0].message })
      }

      // Validate game settings
      const settingsResult = GameSettings.safeParse({ entranceFee, winnerCards, maxPlayers })
      if (!settingsResult.success) {
        return res.status(400).json({ error: settingsResult.error.errors[0].message })
      }

      const code = await generateUniqueGameCode()
      
      // Check for existing games by this nickname
      const existingGames = await prisma.game.findMany({
        where: {
          players: {
            some: {
              nickname
            }
          },
          status: 'waiting'
        }
      })

      if (existingGames.length > 0) {
        return res.status(400).json({ 
          error: 'You already have an active game. Please finish or leave it first.' 
        })
      }

      const game = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { nickname: nicknameResult.data }
        })

        return tx.game.create({
          data: {
            code,
            isPublic: false,
            entranceFee: settingsResult.data.entranceFee,
            winnerCards: settingsResult.data.winnerCards,
            maxPlayers: settingsResult.data.maxPlayers,
            players: {
              connect: { id: user.id }
            }
          },
          include: {
            players: true
          }
        })
      })

      res.json({ game })
    } catch (error) {
      console.error('Create private game error:', error)
      res.status(500).json({ error: 'Failed to create game' })
    }
  },

  // Join a private game with code
  async joinPrivateGame(req: Request, res: Response) {
    try {
      const { code, nickname } = req.body

      // Validate inputs
      const [nicknameResult, codeResult] = await Promise.all([
        NicknameSchema.safeParseAsync(nickname),
        GameCodeSchema.safeParseAsync(code)
      ])

      if (!nicknameResult.success) {
        return res.status(400).json({ error: nicknameResult.error.errors[0].message })
      }

      if (!codeResult.success) {
        return res.status(400).json({ error: codeResult.error.errors[0].message })
      }

      const game = await prisma.game.findUnique({
        where: { code: codeResult.data },
        include: { players: true }
      })

      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }

      // Additional validations
      if (game.status !== 'waiting') {
        return res.status(400).json({ error: 'Game has already started' })
      }

      if (game.players.length >= game.maxPlayers) {
        return res.status(400).json({ error: 'Game is full' })
      }

      // Check if nickname is already taken in this game
      if (game.players.some(p => p.nickname === nickname)) {
        return res.status(400).json({ error: 'Nickname already taken in this game' })
      }

      const updatedGame = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { nickname: nicknameResult.data }
        })

        return tx.game.update({
          where: { id: game.id },
          data: {
            players: {
              connect: { id: user.id }
            }
          },
          include: {
            players: true
          }
        })
      })

      res.json({ 
        game: updatedGame,
        entranceFee: game.entranceFee // Inform player of required entrance fee
      })
    } catch (error) {
      console.error('Join private game error:', error)
      res.status(500).json({ error: 'Failed to join game' })
    }
  },

  // Create or join public game
  async joinPublicGame(req: Request, res: Response) {
    try {
      const { nickname } = req.body

      if (!nickname) {
        return res.status(400).json({ error: 'Nickname is required' })
      }

      // Try to find an available public game
      const availableGame = await prisma.game.findFirst({
        where: {
          isPublic: true,
          status: 'waiting',
          players: {
            none: { nickname }
          }
        },
        include: { players: true }
      })

      if (availableGame && availableGame.players.length < availableGame.maxPlayers) {
        // Join existing game
        const updatedGame = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { nickname }
          })

          return tx.game.update({
            where: { id: availableGame.id },
            data: {
              players: {
                connect: { id: user.id }
              }
            },
            include: {
              players: true
            }
          })
        })

        return res.json({ game: updatedGame, joined: true })
      }

      // Create new public game
      const newGame = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { nickname }
        })

        return tx.game.create({
          data: {
            code: await generateUniqueGameCode(),
            isPublic: true,
            players: {
              connect: { id: user.id }
            }
          },
          include: {
            players: true
          }
        })
      })

      res.json({ game: newGame, created: true })
    } catch (error) {
      res.status(500).json({ error: 'Failed to join public game' })
    }
  }
} 