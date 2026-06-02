# Loopy Feature Completeness & Production Readiness Audit

Ngày audit: 2026-05-31

Phạm vi: rà code-level frontend/backend trong `D:\Loopy` để phân loại feature đã dùng thật, phần còn mock/placeholder, rủi ro logic và mức sẵn sàng viết báo cáo dự án.

> [!IMPORTANT]
> Kết luận ngắn: core flow Auth → Learn → Run/Check → Complete progress và Admin content/lesson ops hiện đã có backend thật, không chỉ là mock. Phần cần ghi rõ trong báo cáo là PvP đang hoạt động theo mô hình single-instance/in-memory timer, chưa phải production-grade khi scale nhiều server; Playground là sandbox local/non-persistent theo thiết kế.

## Ma trận feature

| Khu vực | Frontend | Backend/API | Trạng thái | Ghi chú audit |
|---|---|---|---|---|
| Auth user | `V2AuthPage`, `AuthContext`, `api.ts` | auth routes + httpOnly cookie | Gần production | Không còn phụ thuộc localStorage token cho auth chính; socket đọc cookie/token. |
| Public V2 shell | V2 pages + `V2PublicShell` | `/api/content`, `/api/content/batch` | Gần production | CMS preload batch có fallback i18n, tránh trắng màn hình. |
| Learn catalog | `LearnPage`, `V2LearnPage`, language pages | chapters/lessons/progress APIs | Gần production | Lesson publish/progress logic đã nối backend; cần đảm bảo seed lesson đủ published. |
| Lesson viewer | `LessonViewer.tsx` | execute/check/complete/progress | Production-critical, đã nối thật | Tách đúng `Chạy thử` và `Kiểm tra`; chỉ complete sau backend success. |
| Playground | `V2PlaygroundPage`, `playgroundStorage` | execute API khi chạy code | Intentional sandbox | File/code lưu localStorage; không phải project persistence. Nên mô tả là sandbox thử code. |
| PvP lobby/match | `V2PvPLobbyPage`, `V2PvPMatchPage`, `usePvPSocket` | PvP HTTP + Socket.IO + Supabase | Beta/near production | Logic thật, có matchmaking, ready, submit, ranking; timer in-memory nên không an toàn khi multi-instance/restart. |
| Admin dashboard | `DashboardPage` | admin stats/services | Gần production | Có skeleton chính; đã audit theo pattern admin shell. |
| Admin lessons | `LessonsPage`, `LessonEditorPage` | `/api/admin/lessons`, test-cases | Gần production | Đã fix loading gate, editor upsert lesson/test case thật. |
| Admin content | `ContentManagerPage` | admin content service/routes | Gần production | Đã fix loading gate; CRUD/import/export dùng backend thật. |
| Bulk import | `BulkImportPage` | `/api/admin/import`, import history | Gần production | Có preview client-side và backend import thật; nên tiếp tục giữ audit log/history. |
| Submissions monitor | `SubmissionsPage` | `/api/admin/submissions` | Gần production | Dùng submission thật từ lesson check. |
| Audit logs | `AuditLogsPage` | audit-log service/routes | Gần production | Có skeleton/error/empty; phụ thuộc migration/audit service đã apply. |
| Import history | `ImportHistoryPage` | import-history service/routes | Gần production | Có stats/history skeleton; phụ thuộc bảng import history. |

## Route/frontend audit

### App routing

`AppRouter.tsx` hiện phân lớp rõ:

- Public/V2 routes dùng lazy page và V2 loading treatment.
- Admin routes nằm trong protected/admin layout riêng.
- Learn route chính vẫn giữ immersive learning UI, không ép dùng V2 shell để tránh phá trải nghiệm editor.

Nhận định: hướng tách public product UI và admin UI là đúng. Hai phần vẫn liên kết bằng cùng backend domain: auth/session, content CMS, lesson/progress, submission/audit.

### Loading consistency

Đã kiểm tra các điểm từng gây lệch UX:

- `LessonsPage`: đã dùng `shouldShowLessonSkeleton = isLoadingChapters || isLoadingLessons`.
- `ContentManagerPage`: đã dùng `shouldShowContentSkeleton = isLoadingCategories || isLoadingItems`.
- `AuditLogsPage`: có skeleton rows khi `isLoading`.
- `ImportHistoryPage`: có skeleton stats + rows khi `isLoading`.
- `SubmissionsPage`: có skeleton stats/list; khi refresh trên dữ liệu cũ vẫn giữ UI và spinner refresh, chấp nhận được.

Rủi ro còn lại: `BulkImportPage` không cần initial skeleton vì không fetch data lúc mount; đây là form nhập thủ công.

## Backend/data-flow audit

### Auth/session

Điểm tốt:

- API client dùng cookie credential flow, giảm rủi ro token lưu client-side.
- Socket middleware ưu tiên token handshake, sau đó đọc `auth_token` từ cookie header.
- Admin route được tách admin-auth/admin protected route.

Cần lưu ý khi deploy:

- CORS/cookie same-site/secure phải đúng domain production.
- Socket.IO cần forward cookie/header qua reverse proxy.

### Learn: run vs check vs complete

Luồng đúng với rule Loopy:

1. `Chạy thử` chỉ execute code và trả output.
2. `Kiểm tra` gọi checker/test deterministic.
3. Complete lesson chỉ xảy ra sau khi backend `completeLesson` thành công.
4. Progress dùng atomic upsert/gamification service, tránh read-then-write dễ race.

Rủi ro còn lại:

- Chất lượng lesson phụ thuộc dữ liệu seed: nếu test case/rule thiếu thì UI vẫn chạy nhưng đánh giá yếu.
- Nên có QA checklist cho lesson published: có starter, solution, deterministic checker/test case, hint và common mistakes.

### CMS/content

Điểm tốt:

- Public content có batch endpoint `POST /api/content/batch` và hook preload dùng cache + fallback.
- Admin Content Manager dùng CRUD/import/export thật.
- Route batch đặt trước dynamic route để tránh `/content/:key` nuốt `batch`.

Cần lưu ý:

- Fallback i18n giúp UX không trắng nhưng có thể che missing CMS key. Nên có script/check CI để phát hiện key thiếu.

### PvP

Điểm thật đã có:

- HTTP APIs: create match, get match, join, matchmaking, current question, history, stats, leaderboard.
- Socket.IO events: join/leave/ready, answer/code submission, reaction, typing, disconnect/reconnect.
- Match service chọn câu hỏi theo language/difficulty và filter theo progress/tag.
- Scoring/ranking/submission lưu DB.

Rủi ro production:

1. Timer/cooldown/mutex đang in-memory (`Map`, `Set`, `setTimeout`). Nếu server restart hoặc scale nhiều instance, match có thể kẹt/lệch timer.
2. `redis.service.ts` hiện là skeleton/mock; có `REDIS_URL` cũng chưa connect thật.
3. Room code uniqueness chỉ retry 5 lần, ổn cho quy mô nhỏ nhưng nên có unique constraint + retry theo DB error.
4. Một số query dùng `.single()` cho duplicate-check có thể trả error khi không có row; code hiện vẫn chạy nhưng noise/error handling chưa tinh.

Kết luận PvP: nên ghi là **beta realtime feature** hoặc **single-instance ready**, chưa gọi là fully production-grade multi-instance.

## Mock/placeholder audit

Các kết quả grep đáng chú ý:

- `V2PlaygroundPage` có component tên `PlaygroundMock`: đây là UI preview/sandbox, không phải mock backend nhưng tên dễ gây hiểu nhầm.
- `V2LandingPage` có `ProductMock`: là mockup marketing của sản phẩm, hợp lý trên landing nhưng nên đổi tên nếu muốn code sạch hơn.
- `playgroundStorage.ts` dùng `localStorage`: đúng với sandbox, không dùng cho auth.
- `redis.service.ts` là placeholder thật cho horizontal scaling.

Không thấy dấu hiệu core Learn/Admin đang dùng mock data thay backend cho nghiệp vụ chính sau các phần đã audit.

## Technical debt và logic lệch

### P1 - Nên xử lý trước production scale

1. **Redis/PvP distributed state chưa thật**
   - Tác động: PvP có thể lỗi khi scale/restart.
   - Hướng xử lý: dùng Redis thật cho locks/timers/pubsub hoặc giới hạn deployment 1 instance và ghi rõ.

2. **CMS fallback có thể che missing content**
   - Tác động: báo cáo “đủ CMS” có thể sai nếu key fallback từ i18n.
   - Hướng xử lý: CI script check seed `en/vi` với keys frontend dùng.

3. **Worktree còn nhiều untracked/migration files**
   - Tác động: dễ commit nhầm script/migration tạm.
   - Hướng xử lý: phân loại file trước commit release.

### P2 - Nên dọn để maintainability tốt hơn

1. Đổi tên `ProductMock`/`PlaygroundMock` thành `ProductPreview`/`PlaygroundPreview` để giảm hiểu nhầm trong audit.
2. Tách constants cho V2 footer/header content keys để tránh lặp.
3. Thêm integration test riêng cho AdminContentService thay vì phụ thuộc Supabase thật trong unit suite.
4. Chuẩn hóa docs về trạng thái Playground: local sandbox, không lưu project cloud.

## Đánh giá theo journey

### 1. Người mới vào học

Mức sẵn sàng: **Tốt**

- Auth, public pages, Learn, LessonViewer đã nối thành journey.
- Rule “run không validate, check mới validate” được giữ.
- Progress chỉ lưu sau backend success, không celebration sớm.

Điểm cần QA thêm: seed lesson published đủ và các checker deterministic đúng từng lesson.

### 2. Admin tạo và vận hành content

Mức sẵn sàng: **Tốt**

- Admin Lessons, Editor, Test cases, Content Manager, Bulk Import, Submissions, Audit Logs, Import History đều có UI + service thật.
- Các page list quan trọng đã có skeleton loading nhất quán.

Điểm cần QA thêm: migration production đã apply đủ các bảng content/audit/import history.

### 3. Playground

Mức sẵn sàng: **Đúng phạm vi sandbox**

- Phù hợp để thử code nhanh.
- Không nên trình bày là IDE/project workspace hoàn chỉnh vì persistence đang local.

### 4. PvP

Mức sẵn sàng: **Beta / single-instance production candidate**

- Feature logic khá đầy đủ.
- Rào cản production chính là realtime state/timer chưa distributed.

## Khuyến nghị wording cho báo cáo dự án

Có thể viết:

> Loopy hiện đã hoàn thiện các luồng cốt lõi gồm đăng nhập, học bài theo lộ trình, chạy thử code, kiểm tra bằng checker deterministic, lưu tiến độ, CMS content và admin vận hành lesson/content. Playground hoạt động như sandbox local cho người mới thử code nhanh. PvP đã có realtime match flow hoàn chỉnh ở mức beta/single-instance, nhưng cần bổ sung Redis/distributed timer trước khi scale production nhiều instance.

Không nên viết:

- “PvP production-ready ở mọi môi trường scale” vì Redis đang mock.
- “Playground lưu project cloud” vì hiện persistence là localStorage.
- “100% content không fallback” nếu chưa chạy script coverage key/seed.

## Checklist trước khi chốt release

- [ ] Chạy lại frontend `yarn lint:strict && yarn build`.
- [ ] Chạy lại backend `yarn lint && yarn build && yarn test --runInBand`.
- [ ] Xác nhận migrations content/audit/import history đã apply trên DB target.
- [ ] QA thủ công 1 lesson published: run output, check pass/fail, complete progress.
- [ ] QA admin: Lessons, Content Manager, Audit Logs, Import History loading state.
- [ ] QA PvP 2 browser/user trên cùng một instance.
- [ ] Quyết định ghi PvP là beta hay triển khai Redis trước production scale.
