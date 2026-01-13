import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example userId for seeding (replace with actual Clerk user ID in production)
const EXAMPLE_USER_ID = process.env.SEED_USER_ID || 'user_example123';

async function main() {
  // Delete all data for the example user (for development/testing)
  await prisma.calendarItem.deleteMany({
    where: { userId: EXAMPLE_USER_ID }
  });
  await prisma.transaction.deleteMany({
    where: { userId: EXAMPLE_USER_ID }
  });
  await prisma.budget.deleteMany({
    where: { userId: EXAMPLE_USER_ID }
  });
  await prisma.category.deleteMany({
    where: { userId: EXAMPLE_USER_ID }
  });
  
  // Create default settings if not exists (One-to-One with User)
  const existingSettings = await prisma.settings.findUnique({
    where: { userId: EXAMPLE_USER_ID }
  });
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        userId: EXAMPLE_USER_ID,
        theme: 'dark',
        currency: 'VND',
        language: 'Tiếng Việt',
        dailyUsageCount: 0,
        lastUsageDate: null
      }
    });
  }

  const categories = await prisma.category.createMany({
    data: [
      { userId: EXAMPLE_USER_ID, name: 'Food & Drink', type: 'EXPENSE', icon: 'coffee' },
      { userId: EXAMPLE_USER_ID, name: 'Transport', type: 'EXPENSE', icon: 'bus' },
      { userId: EXAMPLE_USER_ID, name: 'Study', type: 'EXPENSE', icon: 'book' },
      { userId: EXAMPLE_USER_ID, name: 'Salary', type: 'INCOME', icon: 'wallet' },
      { userId: EXAMPLE_USER_ID, name: 'Freelance', type: 'INCOME', icon: 'sparkle' }
    ]
  });

  const categoryList = await prisma.category.findMany();
  const food = categoryList.find((item) => item.name === 'Food & Drink');
  const salary = categoryList.find((item) => item.name === 'Salary');

  if (!food || !salary) {
    throw new Error('Missing seed categories');
  }

  const lunch = await prisma.transaction.create({
    data: {
      userId: EXAMPLE_USER_ID,
      type: 'EXPENSE',
      amount: 45000,
      currency: 'VND',
      categoryId: food.id,
      note: 'Bún bò buổi trưa',
      dateAt: new Date()
    }
  });

  await prisma.transaction.create({
    data: {
      userId: EXAMPLE_USER_ID,
      type: 'INCOME',
      amount: 2000000,
      currency: 'VND',
      categoryId: salary.id,
      note: 'Lương tháng 10',
      dateAt: new Date()
    }
  });

  await prisma.calendarItem.createMany({
    data: [
      {
        userId: EXAMPLE_USER_ID,
        type: 'TASK',
        title: 'Hoàn thành IELTS Reading',
        description: '2h luyện tập mỗi ngày',
        startAt: new Date(),
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        tags: 'study,ielts',
        status: 'TODO'
      },
      {
        userId: EXAMPLE_USER_ID,
        type: 'FINANCE_REMINDER',
        title: 'Nhắc chi ăn trưa',
        description: 'Chi 45k ăn trưa',
        startAt: new Date(),
        tags: 'finance,food',
        linkTransactionId: lunch.id,
        status: 'TODO'
      }
    ]
  });

  await prisma.budget.create({
    data: {
      userId: EXAMPLE_USER_ID,
      month: '2024-10',
      categoryId: food.id,
      limitAmount: 1500000,
      alertPercent: 80
    }
  });

  console.log('Seed data created', { categories });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
