import prisma from '../config/database';

describe('Database Connection', () => {
  it('should connect to the database', async () => {
    try {
      const users = await prisma.user.findMany();
      expect(Array.isArray(users)).toBe(true);
    } catch (error) {
      fail('Database connection failed');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}); 