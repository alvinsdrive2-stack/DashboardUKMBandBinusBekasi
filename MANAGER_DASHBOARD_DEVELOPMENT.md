# UKM Band Dashboard - Manager Dashboard Development

## 📋 Project Overview
Membangun dashboard comprehensive untuk manager UKM Band Bekasi dengan kemampuan monitoring penuh terhadap acara, personel, dan lagu yang akan dibawakan.

## 🎯 Main Objectives
- Memberikan UI yang konsisten antara member dan manager dashboard
- Monitoring real-time terhadap semua aktivitas anggota
- Detail informasi acara lengkap dengan personel dan setlist lagu
- Analytics dan reporting untuk pengambilan keputusan

## ✅ Completed Features

### 1. Manager Sidebar Navigation ✅
**File**: `src/components/ManagerSidebar.tsx`
- UI konsisten dengan member sidebar
- Navigasi lengkap untuk:
  - Dashboard (`/dashboard/manager`)
  - Semua Event (`/dashboard/manager/events`)
  - Setlist Lagu (`/dashboard/manager/songs`)
  - Monitoring Member (`/dashboard/manager/members`)
  - Analytics (`/dashboard/manager/analytics`)
  - Laporan (`/dashboard/manager/reports`)
  - Settings (`/dashboard/manager/settings`)

### 2. Manager Dashboard Page ✅
**File**: `src/app/dashboard/manager/page.tsx`
- Layout sidebar-based sama seperti member
- Stats overview dengan card design yang konsisten
- Monitoring capabilities:
  - Total Acara
  - Event Dipublikasikan
  - Event Aktif
  - Total Anggota
- Quick actions untuk:
  - Tambah acara baru
  - Refresh data
- Preview acara terkini dengan scrollable list
- Modal untuk tambah acara dengan form validation

### 3. Performance Optimizations ✅
- React Query integration untuk data fetching
- Caching system dengan Redis/memory fallback
- Optimized database queries
- Component-based architecture

## 🚧 Current Development Tasks

### 4. Event Detail Page for Managers (In Progress)
**Target**: Halaman detail event yang menampilkan:
- Siapa saja yang main (personnel details)
- Lagu apa yang akan dibawakan (setlist lengkap)
- Real-time status personel
- Edit capabilities untuk manager

**Files to Create/Modify**:
- `src/app/dashboard/manager/events/[id]/page.tsx`
- `src/components/EventDetailView.tsx`
- `src/components/PersonnelList.tsx`
- `src/components/SetlistManager.tsx`

**API Endpoints Needed**:
- `GET /api/events/[id]` - Detail event dengan personel dan songs
- `PUT /api/events/[id]` - Update event details
- `GET /api/events/[id]/personnel` - Get personnel list
- `GET /api/events/[id]/songs` - Get setlist songs

### 5. Real-time Monitoring Features (Pending)
**Target**: WebSocket/Push-based real-time updates
- New member registrations
- Song additions/changes
- Personnel status changes
- Event updates

**Technologies Needed**:
- WebSocket integration
- Server-Sent Events (SSE)
- Push notifications
- Real-time cache invalidation

### 6. Analytics & Reporting (Pending)
**Target**: Comprehensive analytics dashboard
- Member participation rates
- Popular songs/statistics
- Event performance metrics
- Exportable reports (PDF/Excel)

**Components to Create**:
- `src/app/dashboard/manager/analytics/page.tsx`
- `src/app/dashboard/manager/reports/page.tsx`
- `src/components/AnalyticsCharts.tsx`
- `src/components/ReportGenerator.tsx`

## 📊 Database Schema Requirements

### Current Models
```prisma
model Event {
  id          String @id @default(cuid())
  title       String
  description String?
  date        DateTime
  location    String
  status      EventStatus @default(DRAFT)
  // ... existing fields
  personnel   EventPersonnel[]
  songs       EventSong[]
}

model EventPersonnel {
  id        String @id @default(cuid())
  role      String
  status    ApprovalStatus @default(PENDING)
  userId    String?
  eventId   String
  user      User? @relation(fields: [userId], references: [id])
  event     Event @relation(fields: [eventId], references: [id])
}

model EventSong {
  id       String @id @default(cuid())
  title    String
  artist   String?
  key      String?
  duration String?
  notes    String?
  order    Int
  eventId  String
  event    Event @relation(fields: [eventId], references: [id])
}

model User {
  id             String @id @default(cuid())
  name           String
  email          String @unique
  instruments    String[]
  organizationLvl OrganizationLvl
  // ... existing fields
}
```

### Additional Tables Needed for Analytics
```prisma
model EventAnalytics {
  id            String @id @default(cuid())
  eventId       String
  totalViews    Int @default(0)
  registrationRate Float @default(0.0)
  completionRate   Float @default(0.0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model SongStats {
  id         String @id @default(cuid())
  songId     String
  eventId    String
  playCount  Int @default(0)
  popularity Float @default(0.0)
  createdAt  DateTime @default(now())
}
```

## 🔧 Technical Implementation Details

### Component Architecture
```
src/app/dashboard/manager/
├── page.tsx                 # Main dashboard ✅
├── events/
│   ├── page.tsx            # Events list
│   └── [id]/
│       └── page.tsx        # Event detail (target)
├── members/
│   └── page.tsx            # Member monitoring
├── analytics/
│   └── page.tsx            # Analytics dashboard
└── reports/
    └── page.tsx            # Report generation
```

### API Structure
```
src/app/api/
├── events/
│   ├── [id]/
│   │   ├── route.ts        # Get/Update event ✅
│   │   ├── register/
│   │   │   └── route.ts    # Registration ✅
│   │   └── songs/
│   │       ├── route.ts    # Get songs ✅
│   │       ├── [songId]/
│   │       │   └── route.ts # Update/Delete songs ✅
│   │       └── reorder/
│   │           └── route.ts # Reorder songs ✅
│   └── manager/
│       └── route.ts        # Manager events ✅
├── dashboard/
│   └── combine/
│       └── route.ts        # Combined dashboard API ✅
└── stats/
    └── participation/
        └── route.ts        # Participation stats ✅
```

### State Management
- **React Query**: Data fetching dan caching
- **Prisma**: Database ORM
- **NextAuth**: Authentication
- **Chakra UI**: Component library
- **Zustand/React Context**: Client-side state (if needed)

## 🎨 UI/UX Requirements

### Design System
- **Consistent with Member Dashboard**: Same sidebar layout, color scheme, and component patterns
- **Clean White Theme**: White backgrounds with red accent colors
- **Responsive Design**: Mobile-first approach
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages

### Key Components
- **Sidebar Navigation**: Consistent across all manager pages
- **Stats Cards**: Overview metrics with hover effects
- **Data Tables**: Sortable, filterable data displays
- **Modal Forms**: Add/edit functionality
- **Charts**: Visual analytics representation

## 📱 Page Templates

### 1. Event Detail Page Structure
```tsx
// src/app/dashboard/manager/events/[id]/page.tsx
export default function EventDetailPage() {
  return (
    <Box>
      <ManagerSidebar activeRoute="events" />
      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
        <VStack spacing="6" align="stretch">
          {/* Event Header */}
          <EventHeader />

          {/* Personnel & Setlist Grid */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6">
            {/* Personnel List */}
            <PersonnelSection />

            {/* Setlist Songs */}
            <SetlistSection />
          </SimpleGrid>

          {/* Analytics Preview */}
          <EventAnalytics />
        </VStack>
      </Box>
    </Box>
  );
}
```

### 2. Analytics Page Structure
```tsx
// src/app/dashboard/manager/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <Box>
      <ManagerSidebar activeRoute="analytics" />
      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
        {/* Time Range Selector */}
        <DateRangeFilter />

        {/* Key Metrics */}
        <StatsOverview />

        {/* Charts Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6">
          <ParticipationChart />
          <PopularSongsChart />
          <MemberActivityChart />
          <EventTrendsChart />
        </SimpleGrid>
      </Box>
    </Box>
  );
}
```

## 🔐 Security Considerations

### Role-Based Access Control
- **Manager Only**: All manager routes require `COMMISSIONER` or `PENGURUS` role
- **Event Ownership**: Managers can only edit events they created
- **Data Validation**: Server-side validation for all inputs
- **API Security**: Proper authentication checks on all endpoints

### Data Privacy
- **Sensitive Data**: Limit exposure of personal member information
- **Audit Trail**: Log all significant actions (event creation, deletions)
- **Data Encryption**: Secure data transmission

## 🚀 Performance Optimizations

### Database Optimizations
- **Indexes**: Created performance indexes for common queries
- **Query Optimization**: Combined API endpoints to reduce requests
- **Caching Strategy**: Multi-level caching (Redis + memory)

### Frontend Optimizations
- **Code Splitting**: Lazy load heavy components
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring

## 📝 Next Steps Priority

### High Priority
1. **Event Detail Page** - Complete CRUD operations for events with personnel and songs
2. **Member Monitoring** - Real-time view of member activities and participation

### Medium Priority
3. **Real-time Updates** - WebSocket implementation for live updates
4. **Analytics Dashboard** - Basic charts and metrics

### Low Priority
5. **Advanced Analytics** - Machine learning insights and predictions
6. **Export Features** - PDF/Excel report generation
7. **Mobile App** - React Native mobile application

## 🐛 Known Issues & Fixes

### Database Schema Issue
- **Problem**: Column `u.instrument does not exist` error
- **Solution**: Updated query to use `u.instruments` (plural) instead of `u.instrument`

### Import Error
- **Problem**: PerformanceMonitor import error in member dashboard
- **Status**: Under investigation - component may have been removed or renamed

### Route Parameter Handling
- **Problem**: Dynamic route parameter destructuring
- **Solution**: Updated to use `await params` for Next.js 15 compatibility

## 🔗 Dependencies

### Current Dependencies
```json
{
  "@chakra-ui/react": "^2.8.2",
  "@heroicons/react": "^2.0.18",
  "next": "15.5.6",
  "next-auth": "^4.24.8",
  "prisma": "^6.17.1",
  "@tanstack/react-query": "^5.56.2"
}
```

### Additional Dependencies Needed
```json
{
  "recharts": "^2.12.7",        // Charts for analytics
  "socket.io": "^4.7.5",        // Real-time updates
  "socket.io-client": "^4.7.5", // Client-side WebSocket
  "jspdf": "^2.5.1",            // PDF generation
  "xlsx": "^0.18.5"             // Excel export
}
```

---

**Last Updated**: 22 October 2025
**Next Review**: After Event Detail Page completion
**Maintainer**: Development Team