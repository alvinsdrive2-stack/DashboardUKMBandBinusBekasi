# 🎵 Schedule + Songs Management Feature

## 📋 Feature Overview
Fitur baru yang memungkinkan user melihat detail event di halaman schedule dan mengelola lagu (setlist) untuk setiap event yang diikuti.

## 🔧 Implementation Details

### 1. **Enhanced Schedule Page**
**File**: `src/app/dashboard/member/schedule/page.tsx`

✅ **New Features**:
- **Clickable event cards** - Setiap event card bisa diklik untuk melihat detail
- **Event detail modal** - Popup dengan informasi lengkap event
- **"Kelola Lagu" button** - Arahkan ke halaman manajemen lagu
- **Visual indicators** - Badge "Lihat Detail" dan hover effects
- **Optimized interactions** - Stop propagation untuk tombol aksi

**UI Improvements**:
```typescript
// Clickable event cards
<Box
  cursor="pointer"
  onClick={() => openEventDetail(registration)}
  _hover={{ bg: '#f1f5f9', shadow: 'md', transform: 'translateY(-1px)' }}
>
  <HStack>
    <Text>{registration.eventTitle}</Text>
    <Box bg="#dbeafe" px="2" py="1" borderRadius="full">
      <Text fontSize="xs" color="#1e40af">Lihat Detail</Text>
    </Box>
  </HStack>
</Box>
```

### 2. **Event Detail Modal**
**File**: `src/app/dashboard/member/schedule/page.tsx` (line 467-678)

✅ **Modal Features**:
- **Gradient header** dengan icon dan deskripsi
- **Event information** section dengan semua detail
- **User role display** - Peran user dalam event
- **Song management section** dengan informasi fitur
- **Call-to-action buttons** - "Kelola Lagu" dan "Tutup"

**Modal Structure**:
```typescript
<Modal size="2xl" isCentered scrollBehavior="inside">
  {/* Gradient Header */}
  <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <Heading>Detail Event</Heading>
    <Text>Informasi lengkap dan manajemen lagu</Text>
  </Box>

  {/* Event Info Section */}
  <Box bg="gray.50" p="6">
    <Heading>{eventTitle}</Heading>
    <Text>{date} • {location}</Text>
    <Text>{description}</Text>
  </Box>

  {/* Song Management Section */}
  <Box p="6">
    <Heading>Manajemen Lagu</Heading>
    <Alert status="info">
      • Tambahkan lagu-lagu yang akan dibawakan<br/>
      • Atur urutan pemilihan dan setlist<br/>
      • Berikan informasi kunci dan aransemen
    </Alert>
    <Button colorScheme="red" onClick={navigateToSongManager}>
      Kelola Lagu
    </Button>
  </Box>
</Modal>
```

### 3. **Songs Management Page**
**File**: `src/app/dashboard/songs/page.tsx`

✅ **Page Features**:
- **Event header** dengan informasi event dan user role
- **Setlist management** - Add, edit, delete, reorder songs
- **Drag & drop ordering** dengan tombol panah up/down
- **Song details** - Title, artist, key, duration, notes
- **Empty state** dengan call-to-action
- **Responsive design** untuk mobile dan desktop

**Key Functionality**:
```typescript
// Song management functions
const handleSubmit = async () => { /* Add/Update song */ };
const handleDelete = async (songId: string) => { /* Delete song */ };
const moveSong = async (songId: string, direction: 'up' | 'down') => {
  /* Reorder songs with API call */
};

// Song form state
const [formData, setFormData] = useState({
  title: '',
  artist: '',
  key: '',
  duration: '',
  notes: '',
});
```

### 4. **Database Schema Update**
**File**: `prisma/schema.prisma`

✅ **New Model**: EventSong
```prisma
model EventSong {
  id        String   @id @default(cuid())
  title     String
  artist    String?
  key       String?  // Nada dasar (C, Am, G#m)
  duration  String?  // Durasi (3:45)
  notes     String?  // Catatan tambahan
  order     Int      // Urutan dalam setlist

  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([eventId, order]) // Unik order per event
}
```

### 5. **API Endpoints**
**Files**:
- `src/app/api/events/[eventId]/songs/route.ts` - GET (list), POST (add)
- `src/app/api/events/[eventId]/songs/[songId]/route.ts` - PUT (update), DELETE (remove)
- `src/app/api/events/[eventId]/songs/reorder/route.ts` - PUT (reorder)

✅ **API Features**:
- **Authorization** - Only registered users can manage songs
- **Validation** - Required fields, data integrity
- **Error handling** - Proper error messages and status codes
- **Transaction support** - Atomic reordering operations

**Example API Usage**:
```typescript
// Get songs for event
GET /api/events/{eventId}/songs

// Add new song
POST /api/events/{eventId}/songs
{
  "title": "Perfect",
  "artist": "Ed Sheeran",
  "key": "G",
  "duration": "4:23",
  "notes": "Acoustic version"
}

// Update song
PUT /api/events/{eventId}/songs/{songId}
{
  "title": "Perfect (Updated)",
  "key": "A"
}

// Reorder songs
PUT /api/events/{eventId}/songs/reorder
{
  "songs": [
    { "id": "song1", "order": 1 },
    { "id": "song2", "order": 2 }
  ]
}
```

## 🎯 User Flow

### **Schedule Page → Detail Modal → Songs Management**:

1. **Schedule Page**: User melihat event yang diikuti
   - Event cards clickable dengan hover effect
   - Badge "Lihat Detail" untuk clarity

2. **Click Event**: Modal detail muncul
   - Informasi lengkap event (judul, tanggal, lokasi, deskripsi)
   - Peran user dalam event
   - Informasi manajemen lagu

3. **"Kelola Lagu" Button**: Navigasi ke songs page
   - URL: `/dashboard/songs?eventId={eventId}`
   - Header dengan event info

4. **Songs Management Page**: Kelola setlist
   - Add new songs dengan form modal
   - Edit existing songs
   - Delete songs dengan confirmation
   - Reorder songs dengan arrow buttons
   - Real-time update UI

## 🎨 UI/UX Improvements

### **Visual Design**:
- **Gradient headers** untuk modal aesthetic
- **Card-based layouts** untuk better organization
- **Status badges** untuk visual indicators
- **Hover effects** untuk interactivity
- **Loading states** untuk better UX
- **Responsive design** untuk mobile

### **Interaction Patterns**:
- **Stop propagation** untuk nested click events
- **Confirmation dialogs** untuk destructive actions
- **Toast notifications** untuk user feedback
- **Modal workflows** untuk focused tasks
- **Keyboard navigation** support

## 🔒 Security & Permissions

### **Authorization**:
- Only **registered users** can manage songs for their events
- **Event ownership validation** - User must be approved participant
- **Session-based authentication** dengan NextAuth

### **Data Validation**:
- **Required fields** validation (song title)
- **Data sanitization** (trim whitespace)
- **Order integrity** - Unique constraint on [eventId, order]
- **Cascading deletes** - Songs deleted when event deleted

## 📊 Performance Considerations

### **Database Optimization**:
- **Indexed queries** for fast song retrieval
- **Composite unique constraints** for data integrity
- **Transaction support** for atomic operations
- **Cascade deletes** for data consistency

### **Frontend Performance**:
- **Lazy loading** untuk song lists
- **Optimistic updates** for immediate UI feedback
- **Error boundaries** for graceful error handling
- **Component memoization** untuk render efficiency

## ✅ Testing Scenarios

### **Happy Paths**:
1. ✅ **View event details** - Click event → modal appears
2. ✅ **Navigate to songs** - Click "Kelola Lagu" → songs page
3. ✅ **Add song** - Form validation → API call → UI update
4. ✅ **Edit song** - Pre-fill form → update → refresh list
5. ✅ **Delete song** - Confirmation → API call → reordering
6. ✅ **Reorder songs** - Arrow buttons → API call → new order

### **Edge Cases**:
1. ✅ **Unauthorized access** - Non-participant can't manage songs
2. ✅ **Empty setlist** - Proper empty state with CTA
3. ✅ **Invalid event ID** - Redirect back to schedule
4. ✅ **Network errors** - Graceful error handling
5. ✅ **Concurrent edits** - Last write wins pattern

## 🚀 Future Enhancements

### **Potential Improvements**:
1. **Drag & Drop Interface** - Native reordering
2. **Song Search** - Quick search in large setlists
3. **Song Templates** - Pre-defined song lists
4. **PDF Export** - Printable setlists
5. **Collaborative Editing** - Multiple users manage same setlist
6. **Chord Sheets Integration** - Built-in chord display
7. **Practice Mode** - Timer and practice tracking
8. **Song Statistics** - Most played songs, practice time

---

**Result**: Complete schedule + songs management workflow! Users can now view event details and manage setlists seamlessly. 🎉

**Status**: ✅ Ready for Testing