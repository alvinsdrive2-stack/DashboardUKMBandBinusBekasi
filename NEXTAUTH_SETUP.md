# Setup NextAuth untuk UKM Band Dashboard

## 🔧 Konfigurasi Environment Variables

### 1.1 Buat file `.env.local` di root project:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000" # Untuk development
NEXTAUTH_SECRET="your-32-byte-random-secret-key"

# Optional: Upstash Redis untuk session storage
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### 1.2 Generate NEXTAUTH_SECRET:
```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 2: Using OpenSSL
openssl rand -base64 32

# Method 3: Using PowerShell (Windows)
powershell -Command "([System.Convert]::ToBase64String((1..32|%{[byte](Get-Random -Max 256)})))"
```

## 📋 Setup Database Users

### 2.1 Buat User untuk Testing
```sql
-- Masukkan ke database kamu
INSERT INTO "User" (
  "id",
  "name",
  "nim",
  "email",
  "major",
  "instruments",
  "phoneNumber",
  "organizationLvl",
  "technicLvl",
  "createdAt",
  "updatedAt"
) VALUES
-- Manager User
('user_manager_001', 'Ahmad Manager', '2023001', 'manager@ukmband.com', 'Sistem Informasi',
 ARRAY['Vocal'], '08123456789', 'COMMISSIONER', 'ADVANCED', NOW(), NOW()),

-- Member User
('user_member_001', 'Budi Member', '2023002', 'budi@ukmband.com', 'Teknik Informatika',
 ARRAY['Guitar'], '08123456790', 'TALENT', 'INTERMEDIATE', NOW(), NOW()),

-- Another Member
('user_member_002', 'Siswa Drummer', '2023003', 'drummer@ukmband.com', 'Manajemen',
 ARRAY['Drum'], '08123456791', 'TALENT', 'BEGINNER', NOW(), NOW());
```

### 2.2 Setup Melalui API Endpoint (Recommended):
Gunakan endpoint `/api/setup` yang sudah ada:

```bash
# Method 1: Using curl
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{"adminName": "Admin UKM Band", "adminEmail": "admin@ukmband.com"}'

# Method 2: Using fetch
fetch('http://localhost:3000/api/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminName: 'Admin UKM Band',
    adminEmail: 'admin@ukmband.com'
  })
})
```

## 🚀 Cara Login

### 3.1 Credentials yang Digunakan:
Login menggunakan **email** dan **user ID (cuid)**:

| Role | Email | ID Database | Password |
|------|-------|-------------|----------|
| Manager | `manager@ukmband.com` | `user_manager_001` | Email + ID |
| Member  | `budi@ukmband.com` | `user_member_001` | Email + ID |
| Member  | `drummer@ukmband.com` | `user_member_002` | Email + ID |

**Catatan**: Password di NextAuth setup ini menggunakan kombinasi email + user ID, bukan password tradisional.

### 3.2 Flow Login:
1. Buka `http://localhost:3000/auth/signin`
2. Masukkan email yang terdaftar di database
3. Masukkan user ID (cuid) sebagai "NIM"
4. Klik Sign In

## 🔒 Konfigurasi Provider

### 4.1 Sistem Authentication Saat Ini:
- **Provider**: Credentials Provider
- **Strategy**: JWT (Session stored in JWT)
- **Login Method**: Email + User ID
- **No Password Required**: Verifikasi email + ID dari database

### 4.2 Custom Authentication Logic:
```typescript
// File: src/lib/auth.ts
async authorize(credentials) {
  // Cari user berdasarkan email + ID
  const user = await prisma.user.findFirst({
    where: {
      email: credentials.email,
      id: credentials.nim // NIM sebagai user ID
    }
  });

  // Return user data untuk session
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationLvl: user.organizationLvl,
    instruments: user.instruments,
  };
}
```

## 🏗️ Role-based Access Control

### 5.1 User Roles:
```typescript
enum OrganizationLvl {
  COMMISSIONER = "COMMISSIONER", // Admin/Pengurus
  TALENT = "TALENT",             // Member
  SPECTA = "SPECTA",             // Member
  PENGURUS = "PENGURUS"         // Admin/Pengurus
}
```

### 5.2 Access Control:
- **COMMISSIONER/PENGURUS**: Full access to manager dashboard
- **TALENT/SPECTA**: Member access only
- **Authentication Required**: Semua halaman dashboard memerlukan login

## 🛠️ Testing Authentication

### 6.1 Development Testing:
```bash
# Start development server
npm run dev

# Buka browser
http://localhost:3000/auth/signin
```

### 6.2 Test Users:
1. **Admin Test**:
   - Email: `manager@ukmband.com`
   - ID: `user_manager_001`

2. **Member Test**:
   - Email: `budi@ukmband.com`
   - ID: `user_member_001`

## 🌐 Production Setup (Vercel)

### 7.1 Environment Variables di Vercel:
```env
# Production URLs
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-production-secret-key"

# Database Production
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### 7.2 Security Notes:
- Gunakan HTTPS untuk production
- Secret key harus unik dan aman
- Database connection harus secure
- Session storage bisa gunakan Redis untuk better scalability

## 🔍 Troubleshooting

### 8.1 Common Issues:

#### Error: "Database Connection Failed"
```bash
# Check database connection
npx prisma db pull
```

#### Error: "Invalid Credentials"
```bash
# Verify user exists di database
npx prisma studio
# Lihat table User
```

#### Error: "NEXTAUTH_SECRET Missing"
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 8.2 Debug Mode:
```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  // ... other config
}
```

## 🔮 Future Enhancements

### 9.1 Possible Improvements:
1. **Add Password Authentication**: Implement bcrypt hashing
2. **OAuth Providers**: Google, GitHub authentication
3. **Email Verification**: Send verification emails
4. **Two-Factor Authentication**: Add 2FA for security
5. **Rate Limiting**: Prevent brute force attacks

### 9.2 Session Storage:
```typescript
// For production with Redis
import { RedisAdapter } from "@next-auth/redis-adapter";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const authOptions: NextAuthOptions = {
  adapter: RedisAdapter(redis),
  // ... other config
}
```

## ✅ Setup Complete!

Setelah mengikuti langkah-langkah di atas:
1. ✅ Environment variables sudah setup
2. ✅ Database users sudah dibuat
3. ✅ NextAuth configuration sudah siap
4. ✅ Authentication flow sudah bisa di-test

**Next Steps**:
1. Test login dengan user yang sudah dibuat
2. Verifikasi role-based access working
3. Deploy ke Vercel dengan production environment
4. Setup custom domain (opsional)

**Need Help?**
- Check NextAuth documentation: [next-auth.js.org](https://next-auth.js.org)
- Check Prisma documentation: [prisma.io](https://prisma.io)