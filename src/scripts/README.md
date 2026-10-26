# Scripts backend

Lệnh đang dùng: `yarn config:check` validate env không kết nối; `yarn db:audit` đọc catalog/sinh proposal; `yarn build` rồi `yarn migrate` chỉ in plan. Quy trình apply/backup/schema ở [database README](../../database/README.md).

Các lệnh `seed*`, `migrate:content`, `rollback:content`, transform/import/verify legacy là công cụ bảo trì, không thuộc startup/build và không được chạy tự động trên database đang có nội dung. Một số script xóa/ghi hàng loạt. Đọc source, xác nhận đích/dữ liệu và backup trước khi dùng; không chạy rollback/seed để chữa lỗi read-only CMS. CMS hiện tại theo [workflow](../../../docs/CMS_WORKFLOW.md).
