# 🍽️ Sistema SaaS Restaurante — POS Offline-First

**Enterprise-Grade Restaurant Management System** with 100% offline-first capability, intelligent synchronization, and electronic invoicing.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)]()
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)]()
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)]()
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)]()

---

## 🎯 Overview

A **production-ready restaurant management system** designed for modern hospitality. Works seamlessly **offline** with automatic synchronization, supports **electronic invoicing** (SUNAT Peru), and includes a **real-time Kitchen Display System**.

### Key Capabilities
- ✅ **100% Offline-First** — Complete functionality without internet
- 🔄 **Intelligent Sync** — Conflict resolution with smart timestamps
- 🧾 **E-Invoicing** — SUNAT integration (Peru)
- 👨‍🍳 **KDS** — Kitchen Display System real-time
- 📱 **PWA** — Installable native app experience
- 🏪 **Multi-Restaurant** — Support for multiple locations
- 💰 **POS System** — Complete point-of-sale
- 📊 **Analytics** — Sales & performance reports

---

## ✨ Features

### 🍽️ POS & Order Management
- Fast order entry & search
- Table management with status tracking
- Kitchen tickets & preparation time
- Order modifications & special requests
- Split bills & multi-payment support
- Receipt printing (thermal & standard)

### 📱 Offline-First Architecture
- **Instant Response**: All operations happen locally first
- **Dexie.js IndexedDB**: Local data persistence
- **Background Sync**: Queue system for synchronization
- **Conflict Resolution**: Last-write-wins with manual fallback
- **Zero Data Loss**: Guaranteed data safety

### 🧾 Electronic Invoicing (SUNAT)
- Automated invoice generation
- XML UBL 2.1 format compliance
- Digital signature with certificates
- CDR (invoice acknowledgment) handling
- Multiple invoice types (Invoice, Ticket, Credit/Debit Notes)
- Configurable series & numbering

### 👨‍🍳 Kitchen Display System (KDS)
- Real-time order display by station
- Priority & rush order indicators
- Preparation time tracking
- Order completion notifications
- Multi-station support

### 📊 Analytics & Reports
- Sales by period & category
- Top-selling items
- Staff performance metrics
- Hourly revenue tracking
- Customer analytics
- Inventory cost tracking

### 👥 User & Access Management
- Role-based permissions (Admin, Manager, Cashier, Kitchen, Waiter)
- Multi-user support
- Activity logging & audit trails
- Security policies & compliance

### 📦 Inventory Management
- Real-time stock tracking
- Automatic deduction on orders
- Low-stock alerts
- Purchase order management
- Recipe costing & waste tracking

---

## 🛠️ Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| **Framework** | NestJS (Node.js) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Supabase Auth + JWT |
| **Real-time** | Supabase Realtime |
| **API** | REST + WebSockets |

### Frontend
| Component | Technology |
|-----------|------------|
| **Framework** | React 18 |
| **Build Tool** | Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Components** | shadcn/ui |
| **State** | TanStack Query |
| **Local DB** | Dexie.js (IndexedDB) |
| **PWA** | Service Worker |

### Infrastructure
| Component | Technology |
|-----------|------------|
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **Hosting** | Vercel / Self-hosted |
| **Storage** | Supabase Storage |
| **Real-time** | Supabase Realtime |

---

## 📁 Project Structure

```
sistema-SaaS-Restaurante/
├── apps/
│   ├── backend/                    # NestJS API
│   │   ├── src/
│   │   │   ├── modules/           # Business logic modules
│   │   │   │   ├── auth/
│   │   │   │   ├── orders/
│   │   │   │   ├── invoices/
│   │   │   │   ├── products/
│   │   │   │   ├── restaurants/
│   │   │   │   ├── tables/
│   │   │   │   ├── staff/
│   │   │   │   └── analytics/
│   │   │   ├── common/            # Shared utilities
│   │   │   ├── guards/            # Auth guards & middleware
│   │   │   ├── interceptors/      # Response formatting
│   │   │   └── main.ts
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── frontend/                  # React + Vite App
│       ├── src/
│       │   ├── components/        # Reusable components
│       │   │   ├── common/
│       │   │   ├── POS/
│       │   │   ├── KDS/
│       │   │   └── Reports/
│       │   ├── features/          # Feature modules
│       │   │   ├── orders/
│       │   │   ├── invoices/
│       │   │   ├── products/
│       │   │   ├── tables/
│       │   │   └── analytics/
│       │   ├── lib/               # Utilities
│       │   │   ├── api.ts        # API client
│       │   │   ├── sync.ts       # Sync queue
│       │   │   └── validators/
│       │   ├── db/                # Dexie.js config
│       │   │   └── schema.ts
│       │   ├── hooks/             # Custom React hooks
│       │   ├── styles/            # Global styles
│       │   └── App.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── .env.example
│       └── package.json
│
├── supabase/
│   ├── migrations/                # SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_indexes.sql
│   │   └── 003_add_policies.sql
│   ├── seed.sql                  # Test data
│   └── config.toml
│
├── docs/                          # Documentation
│   ├── SETUP.md                  # Installation guide
│   ├── ARCHITECTURE.md           # System design
│   ├── API.md                    # API documentation
│   ├── SYNC_STRATEGY.md          # Offline-first sync
│   └── INVOICING.md              # E-invoicing setup
│
├── .gitignore
├── package.json                  # Monorepo root
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** (via Supabase)
- **TypeScript** knowledge

### Installation

```bash
# 1. Clone repository
git clone https://github.com/jhoncharlesjcar/sistema-SaaS-Restaurante-.git
cd sistema-SaaS-Restaurante-

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 4. Configure Supabase credentials in .env files
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 5. Run database migrations
# (Copy contents of supabase/migrations/001_initial_schema.sql to Supabase SQL editor)

# 6. Start development servers
npm run dev
```

**Result:**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### Environment Configuration

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# SUNAT (Optional)
SUNAT_USER=your_sunat_user
SUNAT_PASSWORD=your_sunat_password
SUNAT_CERTIFICATE=path/to/certificate.pfx
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📊 Database Schema

### Core Tables
```sql
-- Users & Authentication
users (id, email, password_hash, role, restaurant_id, created_at)

-- Restaurant Management
restaurants (id, name, ruc, address, phone, created_at)
tables (id, restaurant_id, number, capacity, status, created_at)
staff (id, restaurant_id, user_id, role, shift, created_at)

-- Products & Inventory
categories (id, restaurant_id, name, description, created_at)
products (id, restaurant_id, category_id, name, price, stock, created_at)
ingredients (id, restaurant_id, name, unit, cost, created_at)
recipes (id, product_id, ingredient_id, quantity, created_at)

-- Orders & Transactions
orders (id, restaurant_id, table_id, status, total, created_at, updated_at, synced_at)
order_items (id, order_id, product_id, quantity, price, notes, created_at)
payments (id, order_id, method, amount, created_at)

-- Invoicing
invoices (id, order_id, number, series, xml, signature, status, created_at)

-- Analytics
sales_logs (id, restaurant_id, amount, items, created_at)
```

---

## 🔄 Offline-First Sync Strategy

### Flow
1. **Local Write**: User action → Written to IndexedDB immediately
2. **Optimistic UI**: UI updates instantly
3. **Background Sync**: Sync queue processes changes in background
4. **Server Sync**: Changes sent to backend when online
5. **Conflict Resolution**: Last-write-wins with timestamp validation
6. **Confirmation**: Local data updated with server response

### Sync Queue
```typescript
// Queued operation structure
{
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'orders' | 'products' | ...
  data: unknown
  timestamp: number
  retries: number
  status: 'PENDING' | 'SENT' | 'CONFIRMED'
}
```

---

## 📚 API Endpoints

### Orders
```
POST   /api/orders              # Create order
GET    /api/orders              # List orders
GET    /api/orders/:id          # Get order details
PUT    /api/orders/:id          # Update order
DELETE /api/orders/:id          # Cancel order
POST   /api/orders/:id/close    # Close order
```

### Invoices
```
POST   /api/invoices            # Create invoice
GET    /api/invoices            # List invoices
GET    /api/invoices/:id        # Get invoice details
POST   /api/invoices/:id/send   # Send to SUNAT
```

### Products
```
GET    /api/products            # List products
POST   /api/products            # Create product
PUT    /api/products/:id        # Update product
DELETE /api/products/:id        # Delete product
```

### Analytics
```
GET    /api/analytics/sales     # Sales report
GET    /api/analytics/inventory # Inventory report
GET    /api/analytics/staff     # Staff performance
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 🚀 Deployment

### Vercel (Frontend)
```bash
vercel deploy
```

### Self-Hosted (Backend)
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t restaurant-saas .
docker run -p 3000:3000 restaurant-saas
```

---

## 🔐 Security Features

- ✅ Row-Level Security (RLS) on database
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Encrypted sensitive data
- ✅ Activity logging & audit trails
- ✅ HTTPS/SSL in production
- ✅ SUNAT certificate security
- ✅ Rate limiting on API

---

## 📖 Documentation

- [Setup Guide](docs/SETUP.md) — Installation & configuration
- [Architecture](docs/ARCHITECTURE.md) — System design & flow
- [API Reference](docs/API.md) — Complete API documentation
- [Sync Strategy](docs/SYNC_STRATEGY.md) — Offline-first synchronization
- [Invoicing Guide](docs/INVOICING.md) — Electronic invoicing (SUNAT)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow code style conventions
4. Submit a pull request

---

## 📝 License

Proprietary — All rights reserved. © 2026 Jhon Charles Almanacén Romero

---

## 🆘 Support

For issues or questions:
- 📧 [GitHub Issues](https://github.com/jhoncharlesjcar/sistema-SaaS-Restaurante-/issues)
- 💬 [Discussions](https://github.com/jhoncharlesjcar/sistema-SaaS-Restaurante-/discussions)
- 📞 Contact: jhoncharlesjcar@gmail.com

---

## 👤 Author

**Jhon Charles Almanacén Romero** — Full-Stack Developer

- GitHub: [@jhoncharlesjcar](https://github.com/jhoncharlesjcar)
- LinkedIn: [Profile](#)

---

<div align="center">

Made with ❤️ for restaurants worldwide

⭐ Star this repository if it helps you!

**[Contribute](#contributing) • [Report Bug](https://github.com/jhoncharlesjcar/sistema-SaaS-Restaurante-/issues) • [Donate](#)**

</div>
