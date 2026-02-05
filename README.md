# StaffDeck - HR SaaS Application

A production-ready HR management system built with the MERN stack (MongoDB, Express, React/Next.js, Node.js).

## 🏗️ Project Structure

The project is divided into two main applications:

- **[frontend/](./frontend/)**: Next.js 14 application (App Router, Tailwind CSS, Zustand)
- **[backend/](./backend/)**: Express.js API server (MongoDB, Mongoose, JWT)

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run seed     # Seeds the database with sample data
npm run dev      # Starts API on http://localhost:5000
```

**Environment Variables:**
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/staffdeck
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev      # Starts App on http://localhost:3000
```

**Environment Variables:**
Create `frontend/.env.local` (if not present):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🔑 Default Credentials

- **Admin Email**: `admin@staffdeck.io`
- **Password**: `admin123`

## 📚 Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14, React 18, Tailwind CSS, global state with Zustand.
- Components based on Shadcn/UI & Radix Primitives.

**Backend:**
- Express.js, MongoDB (Mongoose), JWT Authentication.
- Secure HTTP headers with Helmet.

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License
