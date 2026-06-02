# CMS - Content Management System - Design Document

## Overview

CMS (Content Management System) cho phép admin quản lý nội dung tĩnh (text, navigation, translations) trên website mà không cần code.

**Key Features:**
- Quản lý content items (CRUD operations)
- Export/Import content theo language
- Audit logging cho mỗi lần chỉnh sửa
- Frontend integration với V2 pages
- i18n integration (VI, EN translations)

**Scope:**
- Backend: Database schema, API endpoints, services
- Frontend: Admin UI (Content Manager page, Editor modal)
- Integration: V2 pages fetch content từ API
- i18n: Sync content với translation files

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  V2 Pages (Landing, Languages, Library, Learn, etc.)        │
│  ├── useContent Hook (fetch from API)                       │
│  ├── Fallback to i18n keys                                  │
│  └── Cache content (localStorage)                           │
│                                                               │
│  Admin UI                                                    │
│  ├── ContentManagerPage (/admin/content)                    │
│  ├── ContentEditorModal                                     │
│  └── Export/Import UI                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓ API
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  API Endpoints                                              │
│  ├── /api/admin/content (CRUD)                              │
│  ├── /api/admin/content/export                              │
│  ├── /api/admin/content/import                              │
│  ├── /api/admin/content/categories                          │
│  └── /api/content (public read)                             │
│                                                               │
│  Services                                                    │
│  ├── ContentService (CRUD logic)                            │
│  ├── AuditLogService (logging)                              │
│  └── i18nSyncService (sync with i18n files)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│                   Database (Supabase)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables                                                      │
│  ├── content_categories                                     │
│  ├── content_items                                          │
│  └── admin_audit_logs (existing)                            │
│                                                               │
│  Cache (Redis)                                              │
│  └── content:[category]:[language] (5 min TTL)              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Read Flow (Public):**
1. V2 Page calls `useContent(category, language)`
2. Hook checks localStorage cache
3. If cache miss, fetch from `/api/content?category=X&language=Y`
4. Backend checks Redis cache
5. If cache miss, query database
6. Return content to frontend
7. Frontend caches in localStorage (5 min)

**Write Flow (Admin):**
1. Admin edits content in ContentEditorModal
2. Click Save → POST to `/api/admin/content`
3. Backend validates input (Zod schema)
4. Save to database
5. Invalidate Redis cache
6. Create audit log entry
7. Trigger i18n sync script
8. Return success to frontend

## Components and Interfaces

### Backend Components

#### ContentService
```typescript
interface ContentService {
  getContentItems(category?: string, language?: string, search?: string, limit?: number, offset?: number): Promise<{ items: ContentItem[], total: number }>
  getContentItem(id: string): Promise<ContentItem>
  createContentItem(data: CreateContentItemInput): Promise<ContentItem>
  updateContentItem(id: string, data: UpdateContentItemInput): Promise<ContentItem>
  deleteContentItem(id: string): Promise<void>
  getCategories(): Promise<ContentCategory[]>
  exportContent(language: string): Promise<ExportedContent>
  importContent(data: ImportedContent): Promise<{ imported: number, errors: string[] }>
}
```

#### ContentController
```typescript
interface ContentController {
  getContentItems(req: Request, res: Response): Promise<void>
  createContentItem(req: Request, res: Response): Promise<void>
  updateContentItem(req: Request, res: Response): Promise<void>
  deleteContentItem(req: Request, res: Response): Promise<void>
  getCategories(req: Request, res: Response): Promise<void>
  exportContent(req: Request, res: Response): Promise<void>
  importContent(req: Request, res: Response): Promise<void>
  getPublicContent(req: Request, res: Response): Promise<void>
  getPublicContentByKey(req: Request, res: Response): Promise<void>
}
```

### Frontend Components

#### ContentManagerPage
```typescript
interface ContentManagerPage {
  categories: ContentCategory[]
  selectedCategory: string
  selectedLanguage: string
  searchQuery: string
  contentItems: ContentItem[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  onCategoryChange(category: string): void
  onLanguageChange(language: string): void
  onSearch(query: string): void
  onEdit(item: ContentItem): void
  onDelete(id: string): void
  onExport(): void
  onImport(file: File): void
}
```

#### ContentEditorModal
```typescript
interface ContentEditorModal {
  isOpen: boolean
  mode: 'create' | 'edit'
  item?: ContentItem
  categories: ContentCategory[]
  isLoading: boolean
  errors: Record<string, string>
  onSave(data: ContentItemInput): Promise<void>
  onCancel(): void
}
```

#### useContent Hook
```typescript
interface useContent {
  (category?: string, language?: string): {
    content: ContentItem[]
    loading: boolean
    error: string | null
    refetch(): Promise<void>
  }
}
```

### Frontend Services

#### ContentService (Frontend)
```typescript
interface ContentService {
  getContentItems(category?: string, language?: string, search?: string, limit?: number, offset?: number): Promise<{ items: ContentItem[], total: number }>
  getContentItem(id: string): Promise<ContentItem>
  createContentItem(data: CreateContentItemInput): Promise<ContentItem>
  updateContentItem(id: string, data: UpdateContentItemInput): Promise<ContentItem>
  deleteContentItem(id: string): Promise<void>
  getCategories(): Promise<ContentCategory[]>
  exportContent(language: string): Promise<Blob>
  importContent(file: File): Promise<{ imported: number, errors: string[] }>
  getPublicContent(category?: string, language?: string): Promise<ContentItem[]>
}
```

## Data Models

### ContentCategory
```typescript
interface ContentCategory {
  id: string
  name: string // header, footer, landing, languages, library, learn, playground, docs, onboarding, settings, pvp
  description?: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}
```

### ContentItem
```typescript
interface ContentItem {
  id: string
  categoryId: string
  key: string // e.g., "nav.learn", "landing.hero.title"
  language: string // vi, en
  value: string // actual content text
  description?: string
  type: 'text' | 'markdown' | 'html'
  createdAt: Date
  updatedAt: Date
  createdBy?: string // admin user id
  updatedBy?: string // admin user id
}
```

### CreateContentItemInput
```typescript
interface CreateContentItemInput {
  categoryId: string
  key: string
  language: string
  value: string
  description?: string
  type?: 'text' | 'markdown' | 'html'
}
```

### UpdateContentItemInput
```typescript
interface UpdateContentItemInput {
  value: string
  description?: string
  type?: 'text' | 'markdown' | 'html'
}
```

### ExportedContent
```typescript
interface ExportedContent {
  version: string
  language: string
  exportedAt: Date
  categories: {
    [categoryName: string]: {
      [key: string]: string
    }
  }
}
```

### ImportedContent
```typescript
interface ImportedContent {
  version: string
  language: string
  categories: {
    [categoryName: string]: {
      [key: string]: string
    }
  }
}
```

## Correctness Properties

1. **Content Uniqueness:** Mỗi content item phải có duy nhất một giá trị cho mỗi (category, key, language) combination
2. **Audit Trail:** Mỗi lần admin chỉnh sửa content phải được log với admin_id, action, timestamp
3. **Cache Invalidation:** Khi content được update, Redis cache phải được invalidate ngay lập tức
4. **Fallback Consistency:** Nếu content không tìm thấy, frontend phải fallback sang i18n key một cách consistent
5. **XSS Prevention:** Tất cả content phải được sanitize trước khi render (DOMPurify)
6. **Permission Enforcement:** Chỉ admin có thể create/update/delete content items (RLS policies)
7. **Data Integrity:** Không được phép xóa category nếu còn content items tham chiếu tới nó
8. **Language Consistency:** Mỗi key phải có content items cho tất cả supported languages (VI, EN)

## Error Handling

### Backend Error Handling

**Validation Errors:**
- Invalid input → 400 Bad Request + error details
- Duplicate key → 409 Conflict + error message
- Missing required fields → 400 Bad Request + field names

**Authorization Errors:**
- Not authenticated → 401 Unauthorized
- Not admin → 403 Forbidden

**Not Found Errors:**
- Content item not found → 404 Not Found
- Category not found → 404 Not Found

**Server Errors:**
- Database error → 500 Internal Server Error + error log
- File upload error → 400 Bad Request + error message

### Frontend Error Handling

**API Errors:**
- Network error → Show toast "Không thể kết nối tới server"
- 400 Bad Request → Show validation errors in form
- 401/403 → Redirect to login
- 404 Not Found → Show "Item không tìm thấy"
- 500 Server Error → Show toast "Lỗi server, vui lòng thử lại"

**User Errors:**
- Empty value → Show validation error "Vui lòng nhập nội dung"
- Duplicate key → Show validation error "Key này đã tồn tại"
- File upload error → Show toast "Lỗi upload file"

## Testing Strategy

### Backend Testing

**Unit Tests:**
- ContentService methods (CRUD, export, import)
- Zod schema validation
- Error handling

**Integration Tests:**
- API endpoints (CRUD, export, import)
- Database operations
- Audit logging
- Cache invalidation

**Test Coverage:**
- Target: 80%+ coverage
- Focus on: CRUD operations, validation, error handling

### Frontend Testing

**Unit Tests:**
- ContentManagerPage component
- ContentEditorModal component
- useContent hook
- ContentService methods

**Integration Tests:**
- Content Manager page flow (list, create, edit, delete)
- Export/Import flow
- V2 pages integration with useContent hook

**E2E Tests:**
- Admin creates/edits/deletes content
- Content appears on V2 pages
- Export/Import workflow

**Test Coverage:**
- Target: 70%+ coverage
- Focus on: User interactions, API calls, error handling

### Manual Testing

**Admin UI:**
- Create/edit/delete content items
- Export/import content
- Search/filter content
- Pagination

**V2 Pages:**
- Content loads correctly
- Fallback to i18n keys works
- Caching works (no duplicate API calls)
- Language switching works

**Audit Logging:**
- Audit logs created for each action
- Audit logs visible in audit logs page
- Correct admin_id, action, timestamp

## Notes

- **Cache Strategy:** Redis cache with 5 minute TTL for public content
- **Sanitization:** Use DOMPurify to sanitize content before rendering
- **Pagination:** 50 items per page for content manager
- **Bulk Operations:** Support export/import for backup and migration
- **Audit Trail:** All changes logged for compliance and debugging
- **i18n Sync:** Auto-sync content with i18n JSON files on save
