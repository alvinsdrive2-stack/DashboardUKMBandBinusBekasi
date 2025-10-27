# PWA & Notification System Environment Variables Setup

## Required Environment Variables

### PWA Push Notifications (VAPID Configuration)

Generate VAPID keys using the following command:

```bash
npx web-push generate-vapid-keys
```

Add the generated keys to your `.env.local` file:

```env
# VAPID Configuration for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-here"
VAPID_PRIVATE_KEY="your-private-key-here"
VAPID_EMAIL="your-email@example.com"

# Internal API Key for service-to-service communication
INTERNAL_API_KEY="secure-internal-key-here"

# WebSocket Configuration
NEXTAUTH_URL="http://localhost:3000"
```

### Database Configuration

Ensure your database URL includes the proper configuration for connection pooling:

```env
# PostgreSQL with PgBouncer
DATABASE_URL="postgresql://username:password@host:5432/database?pgbouncer=true&connect_timeout=20"
```

## Setup Instructions

### 1. Generate VAPID Keys

```bash
# Install web-push package globally or locally
npm install -g web-push
# or
npm install --save-dev web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

### 2. Update Environment Variables

Copy the generated keys to your `.env.local` file:

```env
# Example .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BJdtzXzYX3xNv9J5sL9K8mP7QhR6wF2bT3nE4kL7pY1vZ2xG5wC8hM3kP6qR9sT2wF"
VAPID_PRIVATE_KEY="5xJ9nK2mP7qR1sT4wF8bY3vC6zX9gH2nK5pL8qR3sT6wF9bY2xC5vM8pZ1jN4kL"
VAPID_EMAIL="admin@ukm-band-bekasi.com"
INTERNAL_API_KEY="ukm-band-internal-api-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Production Environment Variables

For production deployment, update the variables:

```env
# Production .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-production-public-key"
VAPID_PRIVATE_KEY="your-production-private-key"
VAPID_EMAIL="production@yourdomain.com"
INTERNAL_API_KEY="your-secure-production-internal-key"
NEXTAUTH_URL="https://yourdomain.com"
```

### 4. Testing the Configuration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/admin/notifications-test` to test:
   - Notification creation
   - PWA installation
   - Push notification subscription

### 5. Common Issues & Solutions

#### Push Notifications Not Working

**Issue**: Service worker registration fails
- Ensure `public/sw.js` exists and is accessible
- Check that VAPID keys are correctly set
- Verify your site is served over HTTPS (required for production)

**Issue**: Permission denied
- Users must manually grant notification permission
- Check browser settings for notification permissions

#### WebSocket Connection Issues

**Issue**: Connection fails
- Ensure `NEXTAUTH_URL` is correctly set
- Check that WebSocket port is accessible
- Verify firewall settings allow WebSocket connections

#### Database Connection Issues

**Issue**: Prisma prepared statement errors
- Remove `connection_limit=20` from DATABASE_URL
- Add `pgbouncer=true&connect_timeout=20` for connection pooling
- Ensure database server allows connection pooling

## Security Considerations

### VAPID Keys
- **Public Key**: Can be exposed to the client (NEXT_PUBLIC_ prefix)
- **Private Key**: Must remain secret on the server
- **Email**: Should be a valid contact email for your application

### Internal API Key
- Used for service-to-service communication
- Keep it secret and unique
- Use a strong, randomly generated string

### Database Security
- Use environment variables for database credentials
- Enable SSL/TLS for database connections in production
- Use connection pooling to prevent connection exhaustion

## Browser Compatibility

### Supported Browsers
- **Chrome**: Full PWA and push notification support
- **Firefox**: PWA support, push notifications with limitations
- **Safari**: Limited PWA support, no push notifications on iOS
- **Edge**: Full PWA and push notification support

### Mobile Support
- **Android**: Full PWA capabilities in modern browsers
- **iOS**: Limited PWA support, no push notifications
- **Progressive Enhancement**: App works without PWA features

## Deployment Checklist

Before deploying to production:

- [ ] Generate production VAPID keys
- [ ] Update all environment variables
- [ ] Configure HTTPS
- [ ] Test PWA installation on mobile devices
- [ ] Verify push notifications work across browsers
- [ ] Test WebSocket connections
- [ ] Monitor database connection pooling
- [ ] Set up monitoring for failed push notifications
- [ ] Configure error tracking for WebSocket and push notification failures