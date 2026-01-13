# Smart Calendar Planner + Finance

Next.js + Prisma + Tailwind starter for a combined calendar planner and finance manager.

## Features
- Calendar Planner (task/note/event + finance reminders)
- Finance Manager (income/expense, budget, report)
- Quick Add AI parser with JSON output
- API endpoints for calendar items, transactions, and AI plan
- Seed data with categories, transactions, and sample calendar items

## Tech Stack
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite

## Folder Structure
```
app/
  api/
    calendar-items/route.ts
    plan/route.ts
    transactions/route.ts
  calendar/page.tsx
  finance/page.tsx
  settings/page.tsx
  todo/page.tsx
  layout.tsx
  page.tsx
lib/
  ai.ts
  db.ts
prisma/
  schema.prisma
  seed.ts
public/
```

## Setup
1. Install dependencies
   ```bash
   npm install
   ```
2. Generate Prisma client
   ```bash
   npm run prisma:generate
   ```
3. Run migrations
   ```bash
   npm run prisma:migrate
   ```
4. Seed sample data
   ```bash
   npm run seed
   ```
5. Start dev server
   ```bash
   npm run dev
   ```

## API
### `POST /api/plan`
```json
{ "input": "Chi 45k ăn sáng hôm nay" }
```

### `POST /api/calendar-items`
```json
{
  "type": "TASK",
  "title": "Hoàn thành cuốn sách",
  "description": "",
  "startAt": null,
  "endAt": null,
  "dueAt": "2024-01-30T00:00:00.000Z",
  "tags": ["study"]
}
```

### `POST /api/transactions`
```json
{
  "type": "EXPENSE",
  "amount": 45000,
  "currency": "VND",
  "categoryId": "<category-id>",
  "note": "Ăn sáng",
  "dateAt": "2024-01-10T07:00:00.000Z"
}
```

## AI Parser Output Schema
```json
{
  "clarifyingQuestion": "string | null",
  "assumptions": ["string"],
  "create": {
    "calendarItems": [
      {
        "type": "TASK",
        "title": "string",
        "description": "string",
        "startAt": "ISO-8601 | null",
        "endAt": "ISO-8601 | null",
        "dueAt": "ISO-8601 | null",
        "tags": ["string"]
      }
    ],
    "transactions": [
      {
        "type": "EXPENSE",
        "amount": 45000,
        "currency": "VND",
        "category": "Food",
        "note": "string",
        "dateAt": "ISO-8601"
      }
    ]
  }
}
```
