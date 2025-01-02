import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error)

  if (error instanceof ZodError) {
    // Validation errors (invalid nickname, game settings, etc.)
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors
    })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Database unique constraint violations
      return res.status(409).json({
        error: 'A resource with this identifier already exists'
      })
    }
  }

  // Generic error handling
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  })
} 