# Smart Calendar Planner + Finance

<div align="center">

**An intelligent calendar and finance management application with AI-powered natural language parsing**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Features](#-key-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Introduction

**Smart Calendar Planner + Finance** is a modern, full-stack web application that combines calendar management with personal finance tracking. Built with Next.js 14 and TypeScript, it offers an intuitive interface for managing tasks, events, and financial transactions—all powered by AI-driven natural language processing.

### What Makes It Special?

- 🤖 **AI-Powered Quick Add**: Create tasks, events, and transactions using natural Vietnamese language
- 📅 **Unified Calendar View**: See all your tasks, events, and financial reminders in one place
- 💰 **Real-Time Budget Tracking**: Monitor spending against budgets with visual progress indicators
- 🎨 **Smart Visual Feedback**: Color-coded deadlines and priority indicators
- 📱 **Mobile-First Design**: Fully responsive with touch-optimized interactions
- 🔄 **Drag & Drop**: Intuitively reschedule items by dragging them across the calendar

---

## ✨ Key Features

### 📅 Calendar Management
- **Month View Calendar**: Visual representation of all scheduled items
- **Multiple View Modes**: Toggle between All, Tasks, and Finance views
- **Drag & Drop**: Reschedule items by dragging to different dates
- **Deadline Countdown**: Color-coded visual indicators (red = today, orange = 1-2 days, yellow = 3-7 days)
- **Priority System**: Star indicators for high-priority tasks

### ✅ Task Management
- **Todo Lists**: Organize tasks into Inbox, Planned, and Done
- **Smart Categorization**: Automatic tagging based on content
- **Status Tracking**: Mark tasks as complete with checkboxes
- **Flexible Scheduling**: Support for tasks with or without deadlines

### 💰 Finance Tracking
- **Transaction Management**: Track income and expenses with categories
- **Budget System**: Set monthly budgets per category with alert thresholds
- **Automatic Reminders**: Finance reminders automatically created on calendar
- **Spending Analytics**: Visual progress bars showing budget utilization
- **Category Management**: Customizable categories for better organization

### 🤖 AI Integration
- **Natural Language Parsing**: Input tasks and transactions in Vietnamese
- **Context Understanding**: AI recognizes dates, amounts, categories, and priorities
- **Fallback System**: Rule-based parsing when AI is unavailable
- **Smart Classification**: Distinguishes between tasks, events, and transactions

### 🎨 User Experience
- **Dark Theme**: Modern, eye-friendly dark interface
- **Mobile Navigation**: Slide-out drawer menu for mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Real-Time Updates**: Instant feedback on all actions

---

## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js App Router] --> B[React Components]
        B --> C[Custom Hooks]
        C --> D[API Routes]
    end
    
    subgraph "Backend Layer"
        D --> E[Prisma ORM]
        E --> F[(PostgreSQL)]
        D --> G[AI Service]
        G --> H[Groq API]
    end
    
    subgraph "Authentication"
        I[Clerk Auth] --> D
    end
    
    subgraph "Data Flow"
        J[User Input] --> K[AI Parser]
        K --> L[Data Validation]
        L --> E
        E --> M[UI Update]
    end
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Database** | PostgreSQL + Prisma | Type-safe database access |
| **Authentication** | Clerk | User authentication & management |
| **AI/ML** | Groq SDK | Natural language processing |
| **Drag & Drop** | @dnd-kit | Calendar item manipulation |
| **Date Handling** | date-fns | Date manipulation utilities |
| **Validation** | Zod | Runtime type validation |

### Data Models

```mermaid
erDiagram
    User ||--o{ CalendarItem : creates
    User ||--o{ Transaction : makes
    User ||--o{ Category : owns
    User ||--o{ Budget : sets
    User ||--|| Settings : has
    
    Category ||--o{ Transaction : categorizes
    Category ||--o{ Budget : tracks
    Transaction ||--o{ CalendarItem : generates
    
    CalendarItem {
        string id PK
        string userId FK
        string type
        string title
        datetime startAt
        datetime dueAt
        string status
    }
    
    Transaction {
        string id PK
        string userId FK
        string type
        int amount
        string categoryId FK
        datetime dateAt
    }
    
    Budget {
        string id PK
        string userId FK
        string month
        string categoryId FK
        int limitAmount
        int alertPercent
    }
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.x
- **npm**, **yarn**, or **pnpm**
- **PostgreSQL** database (or use SQLite for development)
- **Git** for version control

### Quick Start

```bash
# Clone the repository
git clone https://github.com/nnt7733/calendar-vip.git
cd calendar-vip

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Configuration)

# Generate Prisma Client
npm run prisma:generate

# Push database schema
npm run prisma:push

# (Optional) Seed sample data
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### One-Command Setup

For a complete setup in one command:

```bash
npm run setup
```

This will:
1. Install all dependencies
2. Generate Prisma Client
3. Push database schema
4. Seed sample data

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/calendar_vip?schema=public"
# For SQLite (development): DATABASE_URL="file:./prisma/dev.db"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Service (Optional but recommended)
GROQ_API_KEY=gsk_your_api_key_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting API Keys

#### Clerk Authentication

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key and secret key to `.env`

#### Groq AI (Optional)

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card required)
3. Navigate to **API Keys** → **Create API Key**
4. Copy the API key (starts with `gsk_`)
5. Add to `.env` as `GROQ_API_KEY`

> **Note**: The application works without Groq API key using rule-based parsing, but AI parsing provides better accuracy and context understanding.

---

## 📁 Project Structure

```
calendar-vip/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── budgets/              # Budget management endpoints
│   │   ├── calendar-items/       # Calendar item CRUD
│   │   ├── categories/           # Category management
│   │   ├── plan/                 # AI parsing endpoint
│   │   ├── settings/             # User settings
│   │   └── transactions/         # Transaction CRUD
│   ├── calendar/                 # Calendar page
│   ├── components/               # Reusable components
│   │   ├── MobileMenu.tsx        # Mobile navigation drawer
│   │   ├── QuickAddButton.tsx    # Quick add trigger
│   │   └── QuickAddModal.tsx     # AI input modal
│   ├── finance/                  # Finance management page
│   ├── settings/                 # Settings page
│   ├── todo/                     # Todo list page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard page
│
├── hooks/                        # Custom React hooks
│   ├── useBudgets.ts             # Budget data fetching
│   └── useCalendarData.ts        # Calendar data fetching
│
├── lib/                          # Shared utilities
│   ├── ai.ts                     # AI parsing logic
│   ├── auth.ts                   # Authentication helpers
│   └── db.ts                     # Prisma client instance
│
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Prisma schema definition
│   └── seed.ts                   # Database seeding script
│
├── public/                       # Static assets
│
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

### Key Directories Explained

- **`app/api/`**: RESTful API endpoints using Next.js Route Handlers
- **`hooks/`**: Custom React hooks for data fetching and state management
- **`lib/`**: Shared business logic and utilities
- **`prisma/`**: Database schema, migrations, and seed data

---

## 🎯 Usage Examples

### Creating Tasks with Natural Language

```typescript
// Input: "Thi lái xe sáng thứ 7 tuần này"
// Output:
{
  type: "TASK",
  title: "Thi lái xe",
  startAt: "2024-01-20T08:00:00.000Z",
  dueAt: "2024-01-20T08:00:00.000Z",
  tags: ["study", "transport"],
  status: "TODO"
}
```

### Adding Financial Transactions

```typescript
// Input: "Chi 45k ăn sáng mai 7pm"
// Output:
{
  transaction: {
    type: "EXPENSE",
    amount: 45000,
    category: "Food",
    dateAt: "2024-01-11T19:00:00.000Z"
  },
  calendarItem: {
    type: "FINANCE_REMINDER",
    title: "45k",
    startAt: "2024-01-11T19:00:00.000Z"
  }
}
```

### Setting Budgets

```typescript
// POST /api/budgets
{
  month: "2024-01",
  categoryId: "category-id",  // or null for total budget
  limitAmount: 5000000,
  alertPercent: 80
}
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema changes to database
npm run prisma:migrate   # Create and apply migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run seed             # Seed database with sample data

# Setup
npm run setup            # Complete setup (install + db + seed)
```

### Database Management

#### Viewing Data

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555` - a visual database browser.

#### Resetting Database

```bash
# Delete database files (SQLite)
rm prisma/dev.db
rm prisma/dev.db-journal

# Recreate schema
npm run prisma:push
npm run seed
```

#### Creating Migrations

```bash
npm run prisma:migrate -- --name add_new_field
```

---

## 📡 API Reference

### Calendar Items

#### `GET /api/calendar-items`

Fetch calendar items with optional date filtering.

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Example:**
```bash
GET /api/calendar-items?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
```

#### `POST /api/calendar-items`

Create a new calendar item.

**Request Body:**
```json
{
  "type": "TASK",
  "title": "Complete project",
  "description": "Finish the documentation",
  "startAt": "2024-01-15T09:00:00.000Z",
  "dueAt": "2024-01-20T17:00:00.000Z",
  "tags": ["work", "urgent"],
  "status": "TODO"
}
```

#### `PATCH /api/calendar-items`

Update an existing calendar item.

**Request Body:**
```json
{
  "id": "item-id",
  "status": "DONE",
  "startAt": "2024-01-16T10:00:00.000Z"
}
```

### Transactions

#### `GET /api/transactions`

Fetch transactions with optional date filtering.

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

#### `POST /api/transactions`

Create a new transaction.

**Request Body:**
```json
{
  "type": "EXPENSE",
  "amount": 45000,
  "currency": "VND",
  "categoryId": "category-id",
  "note": "Lunch",
  "dateAt": "2024-01-10T12:00:00.000Z",
  "paymentMethod": "CASH"
}
```

### Budgets

#### `GET /api/budgets`

Fetch budgets for a specific month.

**Query Parameters:**
- `month` (optional): YYYY-MM format (defaults to current month)

#### `POST /api/budgets`

Create or update a budget (upsert behavior).

**Request Body:**
```json
{
  "month": "2024-01",
  "categoryId": "category-id",
  "limitAmount": 5000000,
  "alertPercent": 80
}
```

### AI Parsing

#### `POST /api/plan`

Parse natural language input into structured data.

**Request Body:**
```json
{
  "input": "Chi 45k ăn sáng mai 7pm"
}
```

**Response:**
```json
{
  "clarifyingQuestion": null,
  "assumptions": ["Đã sử dụng AI để parse."],
  "create": {
    "calendarItems": [...],
    "transactions": [...]
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Prisma Client Not Generated

```bash
npm run prisma:generate
```

#### Database Connection Errors

1. Verify `DATABASE_URL` in `.env` is correct
2. Ensure PostgreSQL is running (if using PostgreSQL)
3. Check database credentials

#### AI Parsing Not Working

1. Verify `GROQ_API_KEY` is set in `.env`
2. Check API key is valid at [console.groq.com](https://console.groq.com)
3. Restart dev server after adding API key
4. Application will fallback to rule-based parsing if AI fails

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma Client
npm run prisma:generate
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features (when applicable)
- Update documentation for API changes
- Ensure code passes linting: `npm run lint`

### Code Style

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Use Tailwind CSS for styling
- Follow existing code structure and patterns

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🗺️ Roadmap

### Short Term (Q1 2024)
- [ ] Recurring transactions and tasks
- [ ] Export/import functionality
- [ ] Enhanced mobile gestures
- [ ] Dark/light theme toggle
- [ ] Multi-language support (English)

### Medium Term (Q2-Q3 2024)
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] Advanced analytics and reports
- [ ] Category icons and customization
- [ ] Notification system
- [ ] Collaborative features (shared calendars)

### Long Term (Q4 2024+)
- [ ] Mobile apps (iOS/Android)
- [ ] AI-powered insights and recommendations
- [ ] Integration with banking APIs
- [ ] Advanced budgeting features (envelopes, goals)
- [ ] Data visualization improvements

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Clerk](https://clerk.com/) - Authentication platform
- [Groq](https://groq.com/) - AI inference platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [date-fns](https://date-fns.org/) - Date utility library
- [@dnd-kit](https://dndkit.com/) - Drag and drop toolkit

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/nnt7733/calendar-vip/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nnt7733/calendar-vip/discussions)

---

<div align="center">

**Built with ❤️ using Next.js and TypeScript**

[⬆ Back to Top](#smart-calendar-planner--finance)

</div>
