# Panduan Deploy ke Vercel

## 📋 Prerequisites
Sebelum memulai, pastikan kamu sudah memiliki:
- Akun GitHub (repo sudah di-push ke GitHub)
- Akun Vercel (daftar gratis di [vercel.com](https://vercel.com))
- Database PostgreSQL (untuk production)

## 🚀 Langkah 1 - Persiapan Repository

### 1.1 Push Code ke GitHub
Pastikan semua code sudah di-push ke repository GitHub:

```bash
# Add semua file yang belum di-commit
git add .

# Commit files
git commit -m "Ready for deployment to Vercel"

# Push ke GitHub
git push origin main
```

### 1.2 Buat Environment Variables untuk Production
Buat file `.env.production` atau setting langsung di Vercel:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"

# Upstash Redis (jika digunakan)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

## 🔧 Langkah 2 - Setup Vercel

### 2.1 Login ke Vercel
1. Kunjungi [vercel.com](https://vercel.com)
2. Login dengan GitHub account
3. Klik **"Add New..."** → **"Project"**

### 2.2 Import Repository
1. Cari repository `ukm-band-bekasi-dashboard`
2. Klik **"Import"**

### 2.3 Konfigurasi Project
Vercel akan otomatis mendeteksi ini sebagai Next.js project:

```json
{
  "name": "ukm-band-bekasi-dashboard",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

## ⚙️ Langkah 3 - Environment Variables

### 3.1 Tambah Environment Variables di Vercel
1. Di dashboard Vercel, buka project kamu
2. Klik **"Settings"** → **"Environment Variables"**
3. Tambahkan variables berikut:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL | Production |
| `DIRECT_URL` | Direct connection string PostgreSQL | Production |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Generate random string | Production |
| `UPSTASH_REDIS_REST_URL` | Redis URL (jika ada) | Production |
| `UPSTASH_REDIS_REST_TOKEN` | Redis Token (jika ada) | Production |

### 3.2 Generate NEXTAUTH_SECRET
```bash
# Generate secret key
openssl rand -base64 32
```

## 🗄️ Langkah 4 - Database Setup

### 4.1 Setup PostgreSQL Database
Gunakan salah satu opsi:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (Recommended)
- [Supabase](https://supabase.com)
- [PlanetScale](https://planetscale.com)
- [Railway](https://railway.app)

### 4.2 Setup Database dengan Vercel Postgres
1. Di dashboard Vercel, klik **"Storage"** → **"Create Database"**
2. Pilih **"Postgres"** dan **"Continue"**
3. Pilih region yang sama dengan project
4. Klik **"Create"**

### 4.3 Generate Prisma Client
Vercel akan otomatis menjalankan `npx prisma generate` saat build.

## 🏗️ Langkah 5 - Build & Deploy

### 5.1 Konfigurasi Build Command
Pastikan build settings di Vercel:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 5.2 Deploy Pertama Kali
1. Klik **"Deploy"** untuk deploy pertama kali
2. Tunggu proses build selesai
3. Jika berhasil, aplikasi akan live di `https://your-app-name.vercel.app`

## 🔄 Langkah 6 - Database Migration

### 6.1 Push Schema ke Database
Setelah deploy pertama, jalankan database migration:

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Pull environment variables locally
vercel env pull .env.production

# Push schema ke production database
npx prisma db push
```

### 6.2 Seed Data (jika ada)
Jika kamu punya seed script:

```bash
npx prisma db seed
```

## 🔍 Langkah 7 - Testing & Verifikasi

### 7.1 Checklist Testing
- [ ] Homepage loads correctly
- [ ] Authentication works (login/logout)
- [ ] Database connection works
- [ ] API routes respond correctly
- [ ] Static assets load properly
- [ ] Responsive design works

### 7.2 Debug Common Issues

#### Build Errors
```bash
# Check logs di Vercel dashboard
# Pastikan semua dependencies terinstall dengan benar
npm install
```

#### Database Connection Errors
```bash
# Test database connection
npx prisma db pull --schema=./prisma/schema.prisma
```

#### Environment Variable Errors
```bash
# Verify environment variables
vercel env ls
```

## 🛠️ Langkah 8 - Custom Domain (Opsional)

### 8.1 Setup Custom Domain
1. Di Vercel dashboard, klik **"Settings"** → **"Domains"**
2. Masukkan custom domain kamu
3. Follow instructions untuk DNS configuration

### 8.2 SSL Certificate
Vercel akan otomatis generate SSL certificate untuk custom domain.

## 📝 Langkah 9 - Monitoring & Maintenance

### 9.1 Monitoring
- Gunakan Vercel Analytics untuk monitoring performance
- Setup uptime monitoring (opsional)

### 9.2 Update Code
Untuk update code:

```bash
# Make changes
git add .
git commit -m "Update features"
git push origin main

# Vercel akan otomatis redeploy
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. Build Timeout
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### 2. Memory Limit
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024
    }
  }
}
```

#### 3. Database Connection Pool
```javascript
// lib/prisma.js
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Connection pooling untuk production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect();
}
```

## 🎉 Selesai!

Aplikasi UKM Band Bekasi Dashboard kamu sekarang sudah live di Vercel!

### Quick Links:
- Dashboard Vercel: `https://vercel.com/username/ukm-band-bekasi-dashboard`
- Live Application: `https://ukm-band-bekasi-dashboard.vercel.app`
- Documentation: [Vercel Docs](https://vercel.com/docs)

---

**💡 Tips Tambahan:**
- Gunakan Vercel Preview untuk setiap PR
- Setup environment variables untuk development/staging
- Monitor usage di Vercel dashboard
- Backup database secara berkala

**🆘 Butuh Bantuan?**
- Vercel Support: [help.vercel.com](https://help.vercel.com)
- NextAuth Documentation: [next-auth.js.org](https://next-auth.js.org)
- Prisma Documentation: [prisma.io](https://prisma.io)