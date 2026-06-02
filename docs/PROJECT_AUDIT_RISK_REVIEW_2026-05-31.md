# Loopy Project Audit - Rủi ro & Cải thiện

Ngày audit: 2026-05-31 16:18-16:22 +07

Phạm vi: rà lại toàn bộ trạng thái hiện tại của `D:\Loopy`, gồm frontend, backend, các thay đổi chưa add/commit, verification tự động, pattern rủi ro và các điểm nên cải thiện trước khi commit/deploy.

## Tóm tắt nhanh

> [!IMPORTANT]
> Các P0 từ audit đã được xử lý: frontend `yarn test` đã pass, backend full suite đã pass, và các script temp one-off rõ ràng đã được dọn. Frontend/backend verification cuối đều exit 0.

| Khu vực | Kết quả | Ghi chú |
|---|---:|---|
| Root git | Không phải repo | `D:\Loopy` không có `.git`; repo nằm ở frontend/backend |
| Frontend lint | ✅ Pass | Final verify: `yarn lint:strict` exit 0 |
| Frontend build | ✅ Pass | Final verify: `yarn build` exit 0 |
| Frontend test | ✅ Pass | Final verify: 3 files, 27 tests pass |
| Backend lint | ✅ Pass | Final verify: `yarn lint` exit 0 |
| Backend build | ✅ Pass | Final verify: `yarn build` exit 0 |
| Backend test | ✅ Pass | Final verify: 9 suites, 201 tests pass |
| V2 footer/header batch pattern | ✅ Sạch | Không còn `useContentByKey` trong V2 footer/pages đã audit |
| Worktree | ⚠️ Còn nhiều untracked hợp lệ | Đã xóa temp one-off; vẫn còn feature/migration files cần chọn lọc khi commit |

## Verification đã chạy

### Frontend

```powershell
# D:\Loopy\loopy-frontend
yarn lint:strict
# Exit code: 0
```

```powershell
# D:\Loopy\loopy-frontend
yarn build
# Exit code: 0
# Vite build: 2739 modules transformed
```

```powershell
# D:\Loopy\loopy-frontend
yarn test
# Exit code: 0
# Test Files: 3 passed
# Tests: 27 passed
```

Resolution: `scripts/sync-content-i18n.test.js` đã được chuyển từ script `assert` tự chạy sang Vitest suite chuẩn (`describe/it/expect`), giữ nguyên 5 behavior checks và loại bỏ console output trong test.

### Backend

```powershell
# D:\Loopy\loopy-backend
yarn lint
# Exit code: 0
```

```powershell
# D:\Loopy\loopy-backend
yarn build
# Exit code: 0
```

```powershell
# D:\Loopy\loopy-backend
yarn lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; yarn build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; yarn test --runInBand; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
# Exit code: 0
# Test Suites: 9 passed
# Tests: 201 passed
```

Resolution:
- Focused `AdminContentService` suite đã pass sau khi sửa admin FK/null setup và category id contract.
- Full backend suite cũng đã pass, xác nhận không còn suite khác bị ảnh hưởng.

## Worktree chưa commit

### Frontend modified tracked files

Các file tracked đang thay đổi:

```text
eslint.config.js
package.json
src/components/admin/layout/Sidebar.tsx
src/components/v2/V2Footer.tsx
src/components/v2/V2Header.tsx
src/components/v2/V2PublicShell.tsx
src/contexts/AuthContext.tsx
src/hooks/useContent.ts
src/i18n/locales/en.json
src/i18n/locales/vi.json
src/pages/v2/V2DocsPage.tsx
src/pages/v2/V2LandingPage.tsx
src/pages/v2/V2LanguageDetailPage.tsx
src/pages/v2/V2LanguagesPage.tsx
src/pages/v2/V2LearnPage.tsx
src/pages/v2/V2LibraryPage.tsx
src/pages/v2/V2OnboardingPage.tsx
src/pages/v2/V2PlaygroundPage.tsx
src/pages/v2/V2ProfilePage.tsx
src/routes/AppRouter.tsx
src/services/admin/content.service.ts
tsconfig.json
```

Untracked đáng chú ý sau cleanup:

```text
scripts/
src/components/admin/ContentEditorModal.tsx
src/components/v2/LoadingScreen.tsx
src/hooks/useContent.test.ts
src/hooks/useContentPreloader.ts
src/pages/admin/ContentManagerPage.tsx
src/pages/v2/V2AuthPage.tsx
src/pages/v2/V2PvPLobbyPage.tsx
src/pages/v2/V2PvPMatchPage.tsx
vitest.config.ts
```

Đã xóa khỏi frontend worktree: `temp-migrate-auth.js`, `temp-migrate-pvp.js`, `update_seeds.cjs`.

### Backend modified tracked files

```text
database/migrations/018-admin-audit-logs.sql
src/routes/admin.routes.ts
src/routes/index.ts
src/routes/public.routes.ts
src/schemas/content.schemas.ts
src/services/audit-log.service.ts
```

Untracked đáng chú ý sau cleanup:

```text
database/migrations/022-content-management.sql
database/migrations/023-fix-content-audit-trigger.sql
database/migrations/024-seed-content-items.sql
database/migrations/025-fix-content-items-rls.sql
database/migrations/026-fix-audit-logs-constraint.sql
database/scripts/SEED_CONTENT_ITEMS.sql
seed_content.js
src/controllers/admin/content.controller.ts
src/schemas/__tests__/
src/scripts/run-migration-026.ts
docs/backend/ADMIN_CONTENT_SERVICE_SUMMARY.md
docs/backend/AUDIT_LOGGING_IMPLEMENTATION.md
docs/backend/I18N_SYNC_IMPLEMENTATION.md
src/services/__tests__/admin-content.service.test.ts
src/services/admin-content.service.ts
```

Đã xóa khỏi backend worktree: `apply-migration.js`, `apply_fix_migration.js`, `apply_migration.js`, `fix-constraint.ts`, `import-new-keys.js`, `seed_content_bypass.js`, `seed_content_direct.js`, `seed_with_sql.js`.

Giữ lại `seed_content.js` vì `SEED_CONTENT_INSTRUCTIONS.md` còn tham chiếu thủ công tới seed flow hiện tại.

> [!WARNING]
> Worktree có nhiều script migration/seed tạm. Nếu commit hết không chọn lọc sẽ dễ đưa nhầm script one-off, credential-adjacent logic hoặc file không còn cần thiết vào repo.

## Audit V2 content/loading hiện tại

### Footer/header atomic preload

Đã rà các pattern sau trong `loopy-frontend/src/pages/v2` và `src/components/v2`:

- `useContentByKey` trong V2 footer/pages: không còn kết quả.
- `<V2Footer />` không truyền `footerContent`: không còn kết quả.
- `<V2PublicShell headerContent={headerContent}>` thiếu `footerContent`: không còn kết quả.
- `footerContent={footerContent}` xuất hiện ở 10 page/shell cần thiết.

Các injection hiện có:

```text
V2DocsPage.tsx
V2LandingPage.tsx
V2LanguageDetailPage.tsx
V2LanguagesPage.tsx
V2LearnPage.tsx
V2LibraryPage.tsx
V2OnboardingPage.tsx
V2PlaygroundPage.tsx
V2ProfilePage.tsx
V2PvPLobbyPage.tsx
V2PublicShell.tsx
```

Nhận định: migration footer batch preload hiện ổn và build pass.

### Loading UX

`LoadingScreen.tsx` hiện dùng:

```tsx
<div className={`flex h-screen flex-col overflow-hidden bg-white ${className}`}>
```

Điểm tốt:
- `h-screen` + `overflow-hidden` giúp không sinh scroll khi loading.
- UI skeleton gọn hơn so với skeleton dài trước đó.

Điểm cần cân nhắc:
- Nền loading là `bg-white`; trước đó user từng phản ánh thấy nền trắng/spinner thoáng qua. Nếu vẫn thấy flash ở vài route, nên đồng bộ nền loading với nền route hoặc app shell.
- Message default là tiếng Anh `Loading content...`. Nếu các page truyền message tiếng Việt thì ổn; nếu không, loading sẽ không đồng bộ ngôn ngữ.

### useContentPreloader

Điểm tốt:
- Batch key loading theo page.
- Có fallback i18n khi API lỗi/missing.
- Có cache reuse từ `useContent`.

Rủi ro/cải thiện:
1. Hook đang gọi từng key song song:
   ```ts
   const fetchPromises = keysToFetch.map(async key => api.request(`/api/content/${key}`))
   ```
   Đây là atomic render ở UI nhưng chưa phải batch API thật. Nếu mỗi page có 50-100 keys, sẽ tạo nhiều request song song.

2. Dependency dùng:
   ```ts
   const keysString = keys.join(',')
   }, [keysString, lang, cacheKey, i18n])
   ```
   Nếu array keys bị đổi thứ tự không chủ ý sẽ refetch. Không nghiêm trọng, nhưng có thể chuẩn hóa bằng const keys ngoài component hoặc `useMemo`.

3. Nếu content không có trong cache và API trả lỗi từng key, hook vẫn render fallback null/i18n. Đây là UX tốt, nhưng dễ che lấp lỗi CMS missing key nếu không có monitoring.

## Test failures đã xử lý

### 1. Frontend test fail do script test không đúng Vitest — ✅ Đã xử lý

File: `loopy-frontend/scripts/sync-content-i18n.test.js`

Resolution:
- Đã chuyển sang Vitest chuẩn (`describe`, `it`, `expect`).
- `yarn test` trong frontend đã pass: 3 files, 27 tests.

Ưu tiên còn lại: không còn P0 cho frontend test; chỉ cần chạy lại trong verify cuối.

### 2. Backend AdminContentService tests phụ thuộc DB thật/current state — ✅ Focused suite đã xử lý

File: `loopy-backend/src/services/__tests__/admin-content.service.test.ts`

Resolution:
- Không còn dùng admin UUID giả gây FK `content_items_created_by_fkey`.
- Sửa test truyền category UUID đúng contract `getContentItems(categoryId, ...)`.
- Focused command đã pass: `yarn test --runInBand src/services/__tests__/admin-content.service.test.ts`.

Còn lại:
- Full backend suite vẫn nên chạy lại ở verify cuối.
- Về lâu dài nên tách suite này thành integration test rõ ràng hoặc mock Supabase cho unit test thật.

## Rủi ro code/runtime phát hiện được

### 1. Console log còn trong runtime path

Các `console.log` đáng chú ý không chỉ là sample code:

```text
src/pages/v2/V2PvPMatchPage.tsx:153 console.log('Participant joined event:', participant)
src/pages/PvPMatchPage.tsx:139 console.log('Participant joined event:', participant)
src/hooks/usePvPSocket.ts:94 console.log('Socket connected:', socket.id)
src/hooks/usePvPSocket.ts:100 console.log('Socket disconnected')
src/services/ErrorLogger.ts:209 console.log(...)
```

Nhận định:
- Sample `console.log` trong code snippet/lesson là hợp lệ.
- Log socket/PvP nên đổi sang logger/debug flag hoặc bỏ trước production.

Ưu tiên: **Trung bình**.

### 2. V2PvPMatchPage vẫn dùng LoadingSpinner

Audit thấy:

```text
src/pages/v2/V2PvPMatchPage.tsx:21 import LoadingSpinner
src/pages/v2/V2PvPMatchPage.tsx:308 <LoadingSpinner size="lg" />
```

Nhận định:
- Page này là game/match interface, không dùng shell/footer nên việc không dùng `LoadingScreen` có thể hợp lý.
- Nhưng nếu user vẫn thấy white spinner flash khi vào PvP match, đây là nguồn khả nghi.

Khuyến nghị:
- Quyết định UX riêng cho match page: giữ spinner compact trong arena, hoặc dùng loading full-screen đồng bộ V2.

Ưu tiên: **Thấp-Trung bình**, tùy QA thực tế.

### 3. `info.md` có một số dòng đã hơi stale

`info.md` đã cập nhật footer migration đầy đủ, nhưng một số dòng cũ có thể gây hiểu nhầm:

- Dòng Current State vẫn nói “CMS Content Migration Phase 2: 7 trang V2”, trong khi sau đó đã có nhiều V2 page mới như Auth/PvP.
- Dòng route sandbox ở phần đầu chưa liệt kê `/v2/auth`, `/v2/pvp`, `/v2/pvp/:roomCode` nếu các route này đã là một phần hiện tại.

Khuyến nghị:
- Sau khi chốt audit/fix, cập nhật thêm “Current State” để nói rõ V2 suite hiện có Auth/PvP pages và trạng thái test fail hiện tại.

Ưu tiên: **Trung bình**.

### 4. Untracked scripts nhiều, cần phân loại trước commit

Các script như:

```text
temp-migrate-auth.js
temp-migrate-pvp.js
apply-migration.js
apply_fix_migration.js
apply_migration.js
seed_content*.js
seed_with_sql.js
import-new-keys.js
update_seeds.cjs
```

Rủi ro:
- Lẫn script chạy một lần vào commit.
- Có thể chứa logic bypass/direct seed không nên giữ lâu.
- Người sau khó biết script nào còn dùng được.

Khuyến nghị:
- Chia nhóm:
  - Giữ: script có command package.json hoặc tài liệu rõ.
  - Chuyển vào `tools/` hoặc `database/scripts/` nếu cần lâu dài.
  - Xóa/ignore: temp one-off đã chạy xong.

Ưu tiên: **Cao trước khi commit**.

## Cải thiện đề xuất theo thứ tự ưu tiên

### P0 - Đã xử lý / còn verify cuối

1. **Fix frontend `yarn test` fail** — ✅ Done
   - `scripts/sync-content-i18n.test.js` đã chuyển sang Vitest.

2. **Fix backend AdminContentService tests** — ✅ Focused suite done
   - Đã sửa admin FK/null setup và category id contract trong test.

3. **Dọn untracked temp scripts** — ✅ Done một phần an toàn
   - Đã xóa temp one-off rõ ràng.
   - Vẫn cần chọn lọc các file migration/feature mới trước commit.

### P1 - Nên xử lý sớm

4. **Cân nhắc batch API thật cho CMS content**
   - `useContentPreloader` hiện atomic ở UI nhưng vẫn fetch từng key.
   - Nên thêm endpoint kiểu `/api/content/batch?language=vi` hoặc POST list keys.

5. **Chuẩn hóa loading state V2PvPMatchPage**
   - Nếu QA còn thấy spinner/nền trắng, thay `LoadingSpinner` bằng V2 loading treatment riêng.

6. **Giảm console logs runtime**
   - PvP/socket logs nên dùng logger/debug flag.

7. **Update `info.md` sau khi fix test/temp**
   - Ghi rõ trạng thái test hiện tại đã pass/fail và files dọn.

### P2 - Cải thiện maintainability

8. **Tạo constant/shared helper cho footer keys/header keys**
   - Hiện 12 footer keys được lặp ở nhiều page.
   - Nên tạo `V2_FOOTER_CONTENT_KEYS`, `extractFooterContent(content)` để giảm drift.

9. **Bổ sung test cho `useContentPreloader`**
   - Test cache hit, fallback i18n, API error, language change.

10. **Tách integration tests phụ thuộc Supabase**
    - Unit test không nên phụ thuộc DB thật.
    - Integration test nên có setup/teardown rõ và chạy riêng.

## Kết luận

Trạng thái sau remediation: full frontend verify pass, full backend verify pass, focused AdminContentService suite đã ổn, file temp one-off rõ ràng đã được dọn khỏi worktree, và polish cuối đã dọn PvP loading/console logs runtime.

Còn cần lưu ý trước khi commit/deploy:

1. Chọn lọc các file feature/migration mới còn untracked để add/commit.
2. Không commit nhầm tài liệu/script seed thủ công nếu chưa muốn giữ lâu dài.
3. Về lâu dài cân nhắc tách integration tests phụ thuộc Supabase khỏi unit tests.
4. Các `console.log` còn lại trong frontend grep là sample code cho learner/example hoặc ErrorLogger method không chạy mặc định.
