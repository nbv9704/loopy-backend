# Database Loopy

Backend dùng Supabase PostgreSQL. **Supabase hiện tại có dữ liệu thật.** Hậu kiểm2026-10-25: ledger041–053 đủ13 checksum khớp source, không còn pending; client catalog giữ SELECT và không còn quyền ghi/TRUNCATE, backend giữ CRUD. Test mặc định dùng mocks hoặc PostgreSQL trong bộ nhớ, không đọc `.env` và không kết nối Supabase.

## Tìm migration ở đâu?

- File nguồn mới: [`migrations/053-catalog-read-privileges.sql`](migrations/053-catalog-read-privileges.sql). Thu quyền ghi catalog của client; không sửa dữ liệu.
- Allowlist/thứ tự/checksum được runner tính từ [`migration-plan.json`](migration-plan.json) và file nguồn. Không sửa các migration đã có ledger.
- Hậu kiểm mới nằm ở `D:\Loopy\artifacts\post-migration-053\2026-10-25\after` và `postflight.json` trong workspace, không thuộc gói source. Các proposal trước053 đã cũ; không chạy lại hoặc bỏ fingerprint/ledger guard. Dùng `yarn db:audit` để kiểm trạng thái mới trước một thay đổi tiếp theo.
- User đã xác nhận có backup trước khi cho phép runner hoàn tất053; agent chưa tự diễn tập restore backup đó. Staging và direct consumers vẫn cần kiểm thử tích hợp theo quy trình bên dưới. Không chạy lại041–053 khi ledger/checksum đã khớp.

## Kiểm tra local an toàn

### Một lệnh audit và xuất SQL đề xuất

```powershell
yarn db:audit
```

Lệnh dùng `DATABASE_URL` trong `.env`, chỉ đọc catalog và ledger trong transaction `REPEATABLE READ READ ONLY`, sau đó rollback. Nếu URL Supabase không khớp `SUPABASE_URL` thì dừng. Không đọc nội dung người dùng, không chạy application RPC hoặc áp dụng migration. Cần cài đủ dev dependencies: schema kỳ vọng được dựng trong PGlite tạm từ baseline + forward allowlist, không phải database Supabase.

Mỗi lần chạy tạo thư mục mới `database/reports/<timestamp>/` (được gitignore), gồm:

- `report.md`: tổng hợp thiếu/khác/dư, nguồn migration theo field và blockers cần review.
- `report.json`: metadata thực tế/kỳ vọng, fingerprint và ledger; definition/default/policy bodies chỉ có hash, không có connection string/password.
- `check.sql`: truy vấn catalog chỉ đọc để đối chiếu thủ công.
- `upgrade.review.sql`: SQL nháp từ **các migration allowlist chưa có ledger**, đúng thứ tự phụ thuộc, kèm transaction/lock, chặn snapshot schema/ledger cũ và kiểm tra capability trước commit. Không tự dựng `ALTER ... IF NOT EXISTS` để bỏ qua schema sai, không chạy baseline trên DB thật, không tự xóa object dư hoặc ghi lịch sử cho migration suy đoán đã chạy.

`yarn db:audit --out=database/reports/my-new-audit` chọn thư mục **chưa tồn tại**. Bình thường xuất report thành công trả0 kể cả có drift; `--strict` trả2 khi có missing/different/blockers để dùng trong CI, trả1 khi command/connect/catalog/fixture lỗi (Yarn có thể chuẩn hóa nonzero exit code).

Chạy trực tiếp SQL nguồn không tự ghi migration ledger. Riêng053 đã có regression chạy lại idempotent: nếu grants đúng nhưng ledger thiếu, sau review/backup dùng runner/proposal chuẩn để thực thi lại và ghi checksum cùng transaction, không chèn ledger thủ công. Hậu kiểm hiện tại đã hoàn tất bước này. Ledger đầy đủ mà còn metadata drift sẽ khóa proposal để ngăn replay lịch sử; cần review forward mới nếu thực sự có thay đổi cần làm.

So sánh gồm bảng/cột/type/nullability/default hash, RPC đúng overload/arguments/return/body/owner/SECURITY DEFINER/search_path, effective EXECUTE và table/column grants của anon/authenticated/service_role, RLS/policy, trigger, constraint, index, sequence và ledger checksum/prefix. PG18 NOT NULL catalog được chuẩn hóa qua attnotnull để không báo thiếu giả trên PG15/17. Bảng `pvp_questions` legacy vắng mặt được ghi nhận optional: PvP hiện dùng official `practice_questions`,043 cũng không yêu cầu tạo bảng cũ này.

**Không đồng nhất “different” với lỗi sản phẩm hoặc tự áp dụng tất cả khác biệt.** Baseline dành cho DB development trống; UUID default tương đương, quyền trên public catalog hoặc policy tùy biến có thể khác trên DB lâu đời. Field provenance phân biệt thay đổi do forward migration với baseline drift mà SQL nháp chưa xử lý. Thiếu/sai cấu trúc baseline bắt buộc, partial050–052, ledger checksum sai/không có thứ tự hoặc schema drift sau ledger đầy đủ sẽ khóa SQL nháp bằng blocker.

SQL nháp có gate mặc định chưa mở. Sau khi review source/backup/staging/client compatibility và không còn blocker, người thực hiện mới chủ động mở dòng `SET LOCAL loopy.reviewed_schema_fingerprint` trong bản nháp. Fingerprint không thay cho backup, không kiểm tra dữ liệu đủ điều kiện constraint, không chứng minh function runtime/PostgREST/Auth hoặc deployment đang tương thích. Nếu schema/ledger đã đổi, audit lại. Quy trình production bên dưới vẫn áp dụng; lệnh audit **không hỗ trợ `--apply`**.

```powershell
yarn build
yarn migrate
yarn test:db
```

`yarn migrate` mặc định chỉ in allowlist và checksum, không mở kết nối DB. `yarn test:db` kiểm tra SQL progress, bulk import rollback, Practice, PvP submissions/round phases, quyền table/column và signup triggers bằng PGlite. Đây là PostgreSQL trong bộ nhớ, **không chứng minh PostgREST/Supabase production hoặc contention nhiều kết nối**.

Không chạy glob `migrations/*.sql`: thư mục chứa rollback, seed, số trùng và `999-drop-cms-tables.sql`. `schema-v2.sql` có `DROP TABLE ... CASCADE`, không phải baseline dùng cho database đã có dữ liệu.

## Những file cần review trước rollout

Allowlist ở `migration-plan.json`:

| File | Thay đổi / lưu ý |
| --- | --- |
| 041 | Progress/reward atomic; sửa ba cột `id` ambiguous, giữ RPC signature. |
| 042 | Import lesson/test/step trong một transaction. |
| 043 | Gỡ table **và column grants** của PUBLIC/anon/authenticated trên bảng nhạy cảm; giữ service_role. Có thể breaking với client PostgREST trực tiếp. Không xóa row/policy/table. |
| 044 | RPC save/start/submit Practice, row locks và retry cùng payload; khóa câu hỏi đã có attempt hoặc PvP reference. Backend mới cần file này trước khi nhận traffic. Thiếu RPC trả 503 `SCHEMA_NOT_READY`, không fallback write không transaction. |
| 045 | RPC metadata read-only cho `/api/ready`; không chạy write để kiểm tra schema. |
| 046 | Giữ signup PvP-stats trigger hoạt động sau khi thu quyền; thêm `practice_set` vào audit constraint. |
| 047 | Bổ sung `increment_participant_score` vào forward plan (trước chỉ có trong migration PvP cũ, thiếu trong fresh baseline); giữ signature và chỉ cho service_role execute. Readiness kiểm tra cả RPC/quyền PvP. |
| 048 | Gộp PvP submission + score/counters trong một transaction, khóa match trước khi chọn bonus; retry cùng payload trả kết quả đã lưu. Lưu thời điểm mở/đóng và index câu hỏi; dùng đồng hồ DB, từ chối bài quá hạn/sai câu/cooldown hoặc khi participant mất kết nối. Hai RPC chỉ service_role execute. Thêm capability `pvpSubmissions` vào readiness, giữ nguyên checksum các migration trước. |
| 049 | Join/ready/disconnect/finish cùng khóa match với submit. Chặn vượt capacity và start lặp; rank/status/career stats cùng transaction. Forfeit 0–0 vẫn thua, nhiều người tiếp tục khi còn ít nhất2 người, tất cả bỏ trận thì cancelled. `left_at` đánh dấu forfeit đã commit, reconnect trong grace chỉ đổi is_connected; người đã forfeit không nộp/rejoin. Bổ sung career answered/correct/accuracy và capability `pvpLifecycle`. Không backfill số liệu lịch sử. |
| 050 | Gắn authenticated check với saved submission/actor/lesson/content_revision. Triggers invalidate khi sửa lesson/step/test-case/chapter language; receipt sequence quyết định latest check. Record + receipt và completion + proof/reward đều atomic; receipt failed không được override thành pass. Thu quyền service_role gọi unchecked041; chỉ wrapper mới được hoàn tất. Readiness thêm lessonChecks. Không backfill proof hoặc đoán timestamp lịch sử. |
| 051 | Matchmaking gộp eligibility, resume live membership, chọn/tạo phòng và join trong một transaction. Advisory locks theo user/queue, match row lock dùng chung049; retry không tạo membership lặp, join thất bại rollback phòng mới. Chỉ service_role execute, readiness thêm pvpMatchmaking. Chỉ chọn official/published true_false hoặc multiple_choice, cùng language/difficulty; thiếu câu hỏi trả409, không tạo phòng trống. |
| 052 | CMS revision trigger cho conditional update/delete; import tất cả category/item trong một transaction, giữ metadata v1 và hỗ trợ v2. Actor phải còn admin, RPC chỉ service_role, readiness thêm cms; không backfill lịch sử hoặc đổi checksum trước. |
| 053 | Năm bảng catalog chỉ đọc cho PUBLIC/anon/authenticated; thu quyền ghi/TRUNCATE và explicit column write ACL, giữ backend CRUD. Guard RLS/write policy/role kế thừa; không đổi rows, policies hoặc lịch sử. Cần review direct consumers và staging trước production. |

`checks/preflight.sql` chỉ đọc schema/grants, không đọc nội dung tài khoản và không sửa dữ liệu. Có thể chạy trong SQL Editor đúng project để kiểm kê trước review. Chưa chạy/thu thập kết quả trên Supabase hiện tại.

## Quy trình production — chưa được thực hiện

1. Xác nhận project đích, backup phục hồi được và quyền truy cập. Đối chiếu preflight với schema thực tế; thử bộ migration trên bản sao/staging trước.
2. Kiểm tra client nào truy cập PostgREST trực tiếp. Frontend Loopy hiện gọi Express, nhưng client bên ngoài chưa được kiểm kê. Thu quyền 043 cần được chủ dự án duyệt.
3. Review diff SQL và chức năng mới. `DATABASE_URL` là biến riêng cho migration runner; dùng secret local, không truyền URL/password trên command line hay ghi vào tài liệu.
4. Sau khi được phép, runner có chế độ `yarn migrate --apply --database-kind=production --allow-production`. **Đây không phải lệnh đã chạy hoặc đề nghị chạy ngay.** Runner dùng advisory lock, transaction toàn bộ plan và ledger checksum. Nếu file đã có ledger đổi checksum, dừng thay vì tự sửa lịch sử.
5. Với 048/049, chờ hết trận đang chạy và tạm ngừng nhận PvP trước rollout: backend cũ chưa mở phase trong DB cho trận hiện tại và dùng left_at khác semantics forfeit mới. Apply schema trước deploy backend, kiểm tra `/api/ready` 200 và thử signup/auth/lesson completion/Practice/PvP trên tài khoản test được duyệt. `/api/health` chỉ là liveness, không xác nhận DB sẵn sàng.
6. Riêng050 cần tạm dừng Learn check/save trong lúc chuyển đổi schema + backend + frontend đồng bộ. Apply050 thu quyền unchecked completion mà backend cũ dùng; không coi đây là thay đổi tương thích để schema-first mà vẫn phục vụ Learn bằng backend cũ. Sau chuyển đổi, reload các tab cũ và kiểm tra lại bài chưa có receipt; completed progress/reward cũ được giữ. Missing schema trả503, stale/latest/version mismatch trả409; không fallback unsafe. Kiểm tra rollback/quyền/schema cache và post-upgrade completion trên staging trước production.
7. 051 cần có trước backend matchmaking mới và kiểm thử qua PostgREST trên staging. Frontend lobby gọi eligibility mới và gửi language_id; triển khai frontend/backend đồng bộ. Matcher trả snapshot/membership đã commit và resume live membership dù retry đổi filters; không fallback sang create/join riêng. Room GET chỉ đọc, socket join là nơi xác nhận kết nối; cần xác minh cookie/CORS qua socket thật.
8. 052 cần tạm dừng CMS writes và chuyển schema/backend/frontend đồng bộ. Client mới gửi expectedRevision cho PUT và revision cho DELETE; client cũ thiếu revision bị từ chối. Kiểm tra trigger revision, RPC grants, public key ambiguity và import/export2.0 qua PostgREST staging; import1.0 vẫn được hỗ trợ. Không xóa/ghép key legacy trùng giữa category để ép rollout pass. Loopy_schema_status wrapper giữ flags cũ và thêm cms; helper trước052 không cho service_role gọi trực tiếp. [CMS workflow](../../docs/CMS_WORKFLOW.md).
9. Nếu lỗi, rollback transaction khi chưa commit. Sau commit, dùng backup và forward-fix đã review; không chạy rollback/drop/seed ngẫu nhiên, không khôi phục grant rộng để che lỗi.

## Database development trống

`baseline/001-current.sql` là snapshot core từ schema/migrations đang có, đã bỏ reset/drop và dùng `gen_random_uuid()`. Runner **từ chối bootstrap nếu public schema có bất kỳ table nào**. Cần Supabase auth schema/roles; local tests mô phỏng phần auth tối thiểu, không cài Supabase Auth.

Chỉ với project development riêng có public schema trống, sau khi kiểm tra đích: `yarn migrate --bootstrap --apply --database-kind=development`.

Baseline không seed lesson/user hoặc số liệu marketing; curriculum trống là hợp lệ. Các endpoint CMS legacy dựa vào `documentation_*`, `landing_*`, `navigation_items`, `header_settings`, `footer_*` chưa có baseline đầy đủ vì source không còn DDL gốc của một số bảng. Frontend hiện dùng content_items/fallback i18n. Không công bố bootstrap này là clone đầy đủ production; cần schema export đã loại secrets/data nếu muốn duy trì các endpoint legacy đó.

## Giới hạn vận hành

- Đổi `.env` local sang Supabase thật nghĩa là thao tác UI như đăng ký/lưu bài có thể ghi dữ liệu thật. Dùng tài khoản test đã chấp thuận hoặc DB development riêng.
- `/api/ready` có thể 503 cho đến khi 043–052 được rollout; schema status cũ thiếu `pvpSubmissions`/`pvpLifecycle`/`lessonChecks`/`pvpMatchmaking`/`cms` cũng không được coi ready. Không đồng nghĩa process API đã chết.
- PvP timers/disconnect grace vẫn nằm trong một process; 048/049 bảo vệ submit/membership/start/finish/rank/stats nhưng chưa giải quyết process restart recovery hoặc multi-instance. Pause/reconnect hiện vẫn khởi động lại thời gian câu như hành vi cũ; submission đã lưu không chấm lại. Nhiều tab và reconnect đã có unit/component tests; chưa test hai browser thật với Supabase Auth/PostgREST.
- 049 sửa cách cộng career totals cho trận hoàn thành mới; không tự tính lại thống kê lịch sử hoặc sửa trận legacy đang lỗi. Matchmaking có thể yêu cầu thử lại khi một ứng viên vừa đầy phòng.
- SQL role tests không thay cho kiểm tra grants thực tế, Auth/PostgREST và concurrency nhiều connection trên staging.
- Migration runner không tự tạo cloud project, backup hoặc deploy; các thao tác đó cần duyệt riêng.

## Regression nhiều kết nối — đã chạy local PostgreSQL 17.10

`yarn test:db:concurrency` dùng ba connection riêng và kiểm tra `pg_blocking_pids`: một connection phải chờ lock của transaction đang giữ, rồi mới xác minh kết quả. Bao gồm matchmaking retry cùng user, hai seeker chung queue, manual join chiếm ghế cuối, queue trống; versioned check/complete/content-write races cả hai chiều, completion/reward, daily counters, late progress, Practice score/retry/start/edit, edit/PvP-reference, PvP bonus/retry/submission-close, last-seat join/ready/start-disconnect/finish và cả hai chiều reconnect-forfeit. CMS thêm concurrent revision update, serialized imports tạo category và stale delete chờ import. Không dùng delay ngẫu nhiên để suy ra concurrency.

Lệnh này **không đọc `.env`**, không fallback sang DATABASE_URL hoặc Supabase. Phải có `LOOPY_DISPOSABLE_DATABASE=true` và `LOOPY_TEST_DATABASE_URL` trỏ localhost, database tên `loopy_test_*` còn trống. Nếu đã có table hoặc auth schema, test dừng; muốn chạy lại phải tạo DB test mới. Không xóa/reset dữ liệu có sẵn.

CI dùng service `postgres:17` riêng và chạy sau build. Local đã dùng PostgreSQL binaries trong thư mục temp, bind127.0.0.1; không cài service hệ thống, không thêm dependency runtime. Thử nghiệm này chứng minh các SQL race đã liệt kê trên fixture, chưa thay cho Supabase Auth/PostgREST, PvP hai browser hoặc staging restore từ production.
