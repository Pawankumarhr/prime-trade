# 🚀 Prime Trade - Productivity Dashboard

A modern, full-stack productivity dashboard with task management, real-time analytics, and AI-powered insights.

![Prime Trade Dashboard](screenshots/dashboard.png)

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | [https://prime-trade-frontend.vercel.app](https://prime-trade-frontend.vercel.app) |
| **Backend API** | [https://prime-trade-7ezv.onrender.com](https://prime-trade-7ezv.onrender.com) |
| **API Documentation** | [https://prime-trade-7ezv.onrender.com/docs](https://prime-trade-7ezv.onrender.com/docs) |

---

## 📖 Overview

Prime Trade is a comprehensive task management application designed for productivity enthusiasts. It features a beautiful glassmorphism UI, real-time analytics, and smart AI-powered insights to help users stay on top of their tasks.

### Key Features

- ✅ **User Authentication** - Secure signup/login with JWT tokens
- ✅ **Task Management** - Full CRUD operations with priorities and due dates
- ✅ **Search & Filter** - Find tasks by status, priority, or search term
- ✅ **Real-time Analytics** - Visual charts and completion metrics
- ✅ **AI Insights** - Smart suggestions based on task patterns
- ✅ **Profile Management** - View and update user profile
- ✅ **Modern UI** - Glassmorphism design with smooth animations

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Language:** JavaScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **HTTP Client:** Fetch API

### Backend
- **Framework:** FastAPI (Python)
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt (passlib)
- **Database:** Supabase PostgreSQL
- **HTTP Client:** httpx

### Database
- **Provider:** Supabase
- **Type:** PostgreSQL
- **Tables:** users, tasks

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Supabase Cloud

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/signup` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login user | ❌ |
| `GET` | `/api/auth/me` | Get current user | ✅ |
| `PATCH` | `/api/auth/profile` | Update profile | ✅ |
| `GET` | `/api/tasks` | Get all tasks | ✅ |
| `POST` | `/api/tasks` | Create task | ✅ |
| `PATCH` | `/api/tasks/:id` | Update task | ✅ |
| `DELETE` | `/api/tasks/:id` | Delete task | ✅ |
| `GET` | `/api/analytics` | Get analytics | ✅ |
| `GET` | `/api/insights` | Get AI insights | ✅ |
| `GET` | `/api/health` | Health check | ❌ |

### Query Parameters for `/api/tasks`
- `status` - Filter by: `pending`, `in-progress`, `done`
- `priority` - Filter by: `low`, `medium`, `high`
- `search` - Search in title and description

---

## 🗂 Folder Structure

```
prime-trade/
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js       # Landing page
│   │   │   ├── login/        # Login page
│   │   │   ├── signup/       # Signup page
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   ├── layout.js     # Root layout
│   │   │   └── globals.css   # Global styles
│   │   ├── context/
│   │   │   └── AuthContext.js # Auth state management
│   │   └── lib/
│   │       └── api.js        # API client functions
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                  # FastAPI Backend
│   ├── main.py               # API routes & logic
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
│
├── postman/                  # API Documentation
│   └── backend-apis.json     # Postman collection
│
├── screenshots/              # UI Screenshots
│   └── (dashboard, login, etc.)
│
└── README.md                 # This file
```

---

## 🧪 How to Run Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local with:
NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

### Database Schema (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

---

## 🔐 Security Practices

| Practice | Implementation |
|----------|----------------|
| **Password Hashing** | bcrypt with salt rounds |
| **Authentication** | JWT tokens with expiration |
| **Input Validation** | Pydantic models with EmailStr |
| **CORS Protection** | Configured allowed origins |
| **SQL Injection** | Parameterized queries via Supabase |
| **XSS Prevention** | React's built-in escaping |

---

## 📈 Scalability Considerations

This application is designed with scalability in mind:

### Architecture
- **Microservices Ready** - Frontend and backend are completely decoupled
- **Stateless Backend** - JWT authentication enables horizontal scaling
- **Database Separation** - Supabase handles database scaling independently

### Horizontal Scaling
- **Frontend** - Vercel auto-scales based on traffic
- **Backend** - Can be replicated behind a load balancer
- **Database** - Supabase supports connection pooling and read replicas

### Performance Optimizations
- **Optimistic Updates** - UI updates immediately without waiting for API
- **Lazy Loading** - Components load on demand
- **Caching** - Browser caches static assets
- **Connection Pooling** - Efficient database connections

### Future Scaling Options
- Add Redis for session caching
- Implement message queues for background tasks
- Use CDN for static assets
- Add database read replicas for read-heavy workloads

---

## 📦 Postman Collection

Import the Postman collection from:
```
postman/backend-apis.json
```

Or access the interactive API docs at:
```
https://prime-trade-7ezv.onrender.com/docs
```

---

## 📸 Screenshots

### Landing Page
![Landing Page](screenshots/landing.png)

### Login Page
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Task Management
![Tasks](screenshots/tasks.png)

---

## 👨‍💻 Author

**Pawan Kumar**
- GitHub: [@Pawankumarhr](https://github.com/Pawankumarhr)
- Email: pk2806@srmist.edu.in

---

## 📄 License

This project is created as part of an internship assignment for PrimeTrade.ai

---

## 🙏 Acknowledgments

- PrimeTrade.ai for the opportunity
- Supabase for the database platform
- Vercel for frontend hosting
- Render for backend hosting

---

*Built with ❤️ for productivity enthusiasts*