# CMS - Content Management System - Tasks

## Overview

Danh sách 19 tasks để triển khai CMS (Content Management System) cho admin UI. Được chia thành 4 phases:
- **Phase 1:** Database & Backend (7 tasks)
- **Phase 2:** Frontend Admin UI (6 tasks)
- **Phase 3:** Frontend Integration (4 tasks)
- **Phase 4:** i18n Integration (3 tasks)

Estimated timeline: 7-11 days

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "name": "Phase 1: Database & Backend",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"],
      "dependencies": []
    },
    {
      "wave": 2,
      "name": "Phase 2: Frontend Admin UI",
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
      "dependencies": ["1.7"]
    },
    {
      "wave": 3,
      "name": "Phase 3: Frontend Integration",
      "tasks": ["3.1", "3.2", "3.3", "3.4"],
      "dependencies": ["2.6"]
    },
    {
      "wave": 4,
      "name": "Phase 4: i18n Integration",
      "tasks": ["4.1", "4.2", "4.3"],
      "dependencies": ["3.4"]
    }
  ]
}
```

# Implementation Plan

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "name": "Phase 1: Database & Backend",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"],
      "dependencies": []
    },
    {
      "wave": 2,
      "name": "Phase 2: Frontend Admin UI",
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
      "dependencies": ["1.7"]
    },
    {
      "wave": 3,
      "name": "Phase 3: Frontend Integration",
      "tasks": ["3.1", "3.2", "3.3", "3.4"],
      "dependencies": ["2.6"]
    },
    {
      "wave": 4,
      "name": "Phase 4: i18n Integration",
      "tasks": ["4.1", "4.2", "4.3"],
      "dependencies": ["3.4"]
    }
  ]
}
```

## Implementation Strategy

### Phase 1: Database & Backend
Triển khai database schema, backend services, controllers, và API endpoints.
- **Duration:** 2-3 days
- **Deliverables:** Database tables, API endpoints, services, audit logging
- **Verification:** All tests pass, API endpoints work correctly

### Phase 2: Frontend Admin UI
Triển khai admin UI để quản lý content items (CRUD, export/import).
- **Duration:** 2-3 days
- **Deliverables:** Content Manager page, Editor modal, frontend services
- **Verification:** All features work, no lint errors, build passes

### Phase 3: Frontend Integration
Triển khai integration giữa V2 pages và CMS API.
- **Duration:** 2-3 days
- **Deliverables:** useContent hook, V2 pages integration, caching
- **Verification:** All pages fetch content correctly, caching works

### Phase 4: i18n Integration
Triển khai sync content với i18n JSON files.
- **Duration:** 1-2 days
- **Deliverables:** Sync script, auto-update on save
- **Verification:** i18n files updated correctly

## Tasks

### Phase 1: Database & Backend

- [x] 1.1 Create Database Migration
  - **Description:** Tạo migration để tạo bảng `content_categories` và `content_items`
  - **Files:** `loopy-backend/database/migrations/022-content-management.sql`
  - **Subtasks:**
    - Create `content_categories` table
    - Create `content_items` table
    - Add indexes for efficient querying
    - Add RLS policies (public read, admin write)
    - Add audit logging trigger
  - **Acceptance:** Migration runs successfully, tables created with correct schema

- [x] 1.2 Create Zod Schemas
  - **Description:** Tạo Zod schemas để validate content items
  - **Files:** `loopy-backend/src/schemas/content.schemas.ts`
  - **Subtasks:**
    - Create `ContentCategorySchema`
    - Create `ContentItemSchema`
    - Create `CreateContentItemSchema`
    - Create `UpdateContentItemSchema`
    - Create `ImportContentSchema`
  - **Acceptance:** All schemas validate correctly, error messages are clear

- [x] 1.3 Create ContentService
  - **Description:** Tạo service layer để quản lý CRUD operations
  - **Files:** `loopy-backend/src/services/content.service.ts`
  - **Subtasks:**
    - Implement `getContentItems(category?, language?, search?, limit?, offset?)`
    - Implement `getContentItem(id)`
    - Implement `createContentItem(data)`
    - Implement `updateContentItem(id, data)`
    - Implement `deleteContentItem(id)`
    - Implement `getCategories()`
    - Implement `exportContent(language)`
    - Implement `importContent(data)`
  - **Acceptance:** All methods work correctly, handle errors gracefully

- [x] 1.4 Create ContentController
  - **Description:** Tạo controller để expose API endpoints
  - **Files:** `loopy-backend/src/controllers/admin/content.controller.ts`
  - **Subtasks:**
    - Implement `GET /api/admin/content`
    - Implement `POST /api/admin/content`
    - Implement `PUT /api/admin/content/:id`
    - Implement `DELETE /api/admin/content/:id`
    - Implement `GET /api/admin/content/categories`
    - Implement `GET /api/admin/content/export`
    - Implement `POST /api/admin/content/import`
    - Implement `GET /api/content` (public)
    - Implement `GET /api/content/:key` (public)
  - **Acceptance:** All endpoints work correctly, return correct response format

- [x] 1.5 Add Routes to Admin Routes
  - **Description:** Thêm routes vào admin routes
  - **Files:** `loopy-backend/src/routes/admin.routes.ts`
  - **Subtasks:**
    - Add content management routes
    - Add public content routes
    - Add middleware for admin authentication
  - **Acceptance:** Routes registered correctly, accessible via API

- [x] 1.6 Add Audit Logging
  - **Description:** Thêm audit logging cho content changes
  - **Files:** `loopy-backend/src/services/audit-log.service.ts` (update)
  - **Subtasks:**
    - Log create content action
    - Log update content action
    - Log delete content action
    - Log import content action
  - **Acceptance:** Audit logs created correctly, visible in audit logs page

- [x] 1.7 Backend Verification
  - **Description:** Verify backend implementation
  - **Subtasks:**
    - Run `yarn lint && yarn build && yarn test --runInBand`
    - Test all API endpoints manually
    - Test audit logging
  - **Acceptance:** All tests pass, no lint errors, API endpoints work correctly

### Phase 2: Frontend Admin UI

- [x] 2.1 Create ContentManagerPage Component
  - **Description:** Tạo trang quản lý content
  - **Files:** `loopy-frontend/src/pages/admin/ContentManagerPage.tsx`
  - **Subtasks:**
    - Create page layout (sidebar + main area)
    - Implement category filter (sidebar)
    - Implement language filter (dropdown)
    - Implement search box
    - Implement content items table
    - Implement pagination
    - Implement edit/delete buttons
    - Implement new item button
    - Implement export/import buttons
  - **Acceptance:** Page renders correctly, all features work

- [x] 2.2 Create ContentEditorModal Component
  - **Description:** Tạo modal để chỉnh sửa content items
  - **Files:** `loopy-frontend/src/components/admin/ContentEditorModal.tsx`
  - **Subtasks:**
    - Create form fields (Key, Category, Language, Value, Description, Type)
    - Implement validation
    - Implement save/cancel buttons
    - Implement error handling
    - Implement loading state
  - **Acceptance:** Modal renders correctly, validation works, save/cancel work

- [x] 2.3 Create Frontend ContentService
  - **Description:** Tạo service để fetch/update content từ API
  - **Files:** `loopy-frontend/src/services/admin/content.service.ts`
  - **Subtasks:**
    - Implement `getContentItems(category?, language?, search?, limit?, offset?)`
    - Implement `getContentItem(id)`
    - Implement `createContentItem(data)`
    - Implement `updateContentItem(id, data)`
    - Implement `deleteContentItem(id)`
    - Implement `getCategories()`
    - Implement `exportContent(language)`
    - Implement `importContent(file)`
  - **Acceptance:** All methods work correctly, handle errors gracefully

- [x] 2.4 Add Route to AppRouter
  - **Description:** Thêm route `/admin/content` vào AppRouter
  - **Files:** `loopy-frontend/src/routes/AppRouter.tsx`
  - **Subtasks:**
    - Add lazy import for ContentManagerPage
    - Add route `/admin/content`
    - Add Suspense fallback
  - **Acceptance:** Route works correctly, page loads

- [x] 2.5 Add Sidebar Item
  - **Description:** Thêm "Content Manager" item vào admin sidebar
  - **Files:** `loopy-frontend/src/components/admin/layout/Sidebar.tsx`
  - **Subtasks:**
    - Add "Content Manager" item
    - Add icon
    - Add link to `/admin/content`
    - Add to "Content" section
  - **Acceptance:** Sidebar item appears, link works

- [x] 2.6 Frontend Verification
  - **Description:** Verify frontend implementation
  - **Subtasks:**
    - Run `yarn lint:strict && yarn build`
    - Test Content Manager page manually
    - Test editor modal
    - Test export/import
  - **Acceptance:** All tests pass, no lint errors, features work correctly

### Phase 3: Frontend Integration

- [x] 3.1 Create useContent Hook
  - **Description:** Tạo hook để fetch content từ API
  - **Files:** `loopy-frontend/src/hooks/useContent.ts`
  - **Subtasks:**
    - Implement hook to fetch content from `/api/content`
    - Implement caching (localStorage)
    - Implement fallback to i18n keys
    - Implement error handling
  - **Acceptance:** Hook works correctly, caching works, fallback works

- [x] 3.2 Update V2 Pages to Use useContent
  - **Description:** Update V2 pages để dùng `useContent` hook
  - **Files:**
    - `loopy-frontend/src/pages/v2/V2LandingPage.tsx`
    - `loopy-frontend/src/pages/v2/V2LanguagesPage.tsx`
    - `loopy-frontend/src/pages/v2/V2LanguageDetailPage.tsx`
    - `loopy-frontend/src/pages/v2/V2LibraryPage.tsx`
    - `loopy-frontend/src/pages/v2/V2LearnPage.tsx`
    - `loopy-frontend/src/pages/v2/V2PlaygroundPage.tsx`
    - `loopy-frontend/src/pages/v2/V2DocsPage.tsx`
    - `loopy-frontend/src/pages/v2/V2OnboardingPage.tsx`
    - `loopy-frontend/src/pages/v2/V2ProfilePage.tsx`
    - `loopy-frontend/src/pages/v2/V2PvPLobbyPage.tsx`
  - **Subtasks:**
    - Replace mock data with `useContent` hook
    - Replace hardcoded text with content from API
    - Add fallback to i18n keys
    - Test each page
  - **Acceptance:** All pages fetch content correctly, fallback works

- [x] 3.3 Update V2Header and V2Footer
  - **Description:** Update V2Header/V2Footer để dùng content từ API
  - **Files:**
    - `loopy-frontend/src/components/v2/V2Header.tsx`
    - `loopy-frontend/src/components/v2/V2Footer.tsx`
  - **Subtasks:**
    - Replace hardcoded navigation text with content from API
    - Replace hardcoded footer text with content from API
    - Add fallback to i18n keys
  - **Acceptance:** Header/Footer display content correctly

- [x] 3.4 Frontend Integration Verification
  - **Description:** Verify frontend integration
  - **Subtasks:**
    - Run `yarn lint:strict && yarn build`
    - Test all V2 pages manually
    - Test content caching
    - Test fallback to i18n keys
  - **Acceptance:** All tests pass, no lint errors, pages work correctly

### Phase 4: i18n Integration

- [x] 4.1 Create Content Sync Script
  - **Description:** Tạo script để sync content từ database với i18n JSON files
  - **Files:** `loopy-frontend/scripts/sync-content-i18n.ts`
  - **Subtasks:**
    - Fetch content từ API
    - Generate i18n JSON files
    - Save to `loopy-frontend/src/locales/[language].json`
  - **Acceptance:** Script runs successfully, i18n files updated

- [x] 4.2 Auto-Update i18n on Content Save
  - **Description:** Tự động update i18n files khi admin save content
  - **Files:** `loopy-backend/src/services/content.service.ts` (update)
  - **Subtasks:**
    - After save content, trigger sync script
    - Update i18n JSON files
    - Commit changes to git (optional)
  - **Acceptance:** i18n files updated automatically

- [x] 4.3 i18n Integration Verification
  - **Description:** Verify i18n integration
  - **Subtasks:**
    - Test content sync script
    - Test auto-update on content save
    - Test i18n files are updated correctly
  - **Acceptance:** i18n integration works correctly

## Notes

- **Total Tasks:** 19
- **Estimated Timeline:** 7-11 days
- **Dependencies:** Each phase depends on previous phase completion
- **Verification:** Each phase has a verification task to ensure quality
- **Rollback Plan:** If any phase fails, can rollback to previous stable state
