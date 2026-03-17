[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/twPj_hbU)

# Inventory Management App

A full-stack inventory management system for tracking items, recording sales, and analysing revenue. Built with Next.js on the front-end and a Node.js/Express back-end, backed by a PostgreSQL database.

### Thomas Peelman

---

## Features

- **Inventories** — create and manage multiple inventories, each with its own set of items
- **Items** — add items with a buy price and quantity; track stock levels in real time
- **Selling** — sell items individually or via a shopping cart; supports cash and card payments
- **Price variables** — define named price presets (fixed or percentage markup) per item
- **Sales history** — view and revert past transactions
- **Analytics** — profit, revenue, top-selling items, sales by day, and payment method breakdown; exportable to Excel
- **Multi-user** — invite users to inventories with owner / editor / viewer roles
- **Authentication** — email/password sign-up and login via Better Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | Next.js (Pages Router), TypeScript, Tailwind CSS |
| Back-end | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | Better Auth |
| Export | SheetJS (xlsx) |
| Containerisation | Docker / Docker Compose |

---

## Project Structure

```
inventory_app/
├── front-end/
│   ├── components/
│   │   ├── analytics/       # SummaryCards, TopSellingTable, SalesByDayTable, …
│   │   ├── auth/            # LoginForm, RegisterForm
│   │   ├── common/          # LoadingScreen, ErrorScreen
│   │   ├── history/         # HistoryStatsCards, SalesHistoryTable
│   │   ├── home/            # HomePageInformation
│   │   ├── inventory/       # InventoryCard, SellModal, CartSidebar, …
│   │   └── layout/          # Header
│   ├── lib/
│   │   ├── api.ts           # All API calls
│   │   └── auth-client.ts   # Better Auth client
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── Login/
│   │   ├── Register/
│   │   └── Inventory/
│   │       ├── index.tsx         # Inventory list
│   │       └── [id]/
│   │           ├── index.tsx     # Overview & sell
│   │           ├── manage.tsx    # Edit items & price variables
│   │           ├── history.tsx   # Sales history
│   │           └── analytics.tsx # Analytics dashboard
│   └── types/
└── back-end/
    ├── src/
    │   ├── routes/
    │   ├── services/
    │   └── prisma/
    └── prisma/
        └── schema.prisma
```

---

## Getting Started

### With Docker Compose (recommended)

```bash
docker compose up --build
```

This starts the front-end, back-end, and a PostgreSQL database together.

### Without Docker

**Back-end**
```bash
cd back-end
npm install
npx prisma migrate dev
npm run dev
```

**Front-end**
```bash
cd front-end
npm install
npm run dev
```

The front-end runs on `http://localhost:3001` and expects the back-end on `http://localhost:3000` by default. Override with `NEXT_PUBLIC_API_URL` in `front-end/.env.local`.

---

## Environment Variables

**`front-end/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**`back-end/.env`**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory
BETTER_AUTH_SECRET=your-secret
```
