import '@testing-library/jest-dom'
import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn()
}))

export type Context = {
  prisma: DeepMockProxy<PrismaClient>
}

export function createMockContext(): Context {
  return {
    prisma: mockDeep<PrismaClient>()
  }
} 