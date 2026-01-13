import { PrismaClient, CategoryType, TransactionType, CalendarItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.calendarItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();

  const categories = await prisma.category.createMany({
    data: [
      { name: 'Food & Drink', type: CategoryType.EXPENSE, icon: 'coffee' },
      { name: 'Transport', type: CategoryType.EXPENSE, icon: 'bus' },
      { name: 'Study', type: CategoryType.EXPENSE, icon: 'book' },
      { name: 'Salary', type: CategoryType.INCOME, icon: 'wallet' },
      { name: 'Freelance', type: CategoryType.INCOME, icon: 'sparkle' }
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
      type: TransactionType.EXPENSE,
      amount: 45000,
      currency: 'VND',
      categoryId: food.id,
      note: 'Bún bò buổi trưa',
      dateAt: new Date()
    }
  });

  await prisma.transaction.create({
    data: {
      type: TransactionType.INCOME,
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
        type: CalendarItemType.TASK,
        title: 'Hoàn thành IELTS Reading',
        description: '2h luyện tập mỗi ngày',
        startAt: new Date(),
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        tags: 'study,ielts'
      },
      {
        type: CalendarItemType.FINANCE_REMINDER,
        title: 'Nhắc chi ăn trưa',
        description: 'Chi 45k ăn trưa',
        startAt: new Date(),
        tags: 'finance,food',
        linkTransactionId: lunch.id
      }
    ]
  });

  await prisma.budget.create({
    data: {
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
