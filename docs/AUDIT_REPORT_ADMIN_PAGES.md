# CMS Content Audit Report

## Executive Summary
- Total content items audited: 40
- Hardcoded items: 40 (100%)
- Items in CMS: 0 (0%)
- Editable items: 0 (0%)
- Estimated effort to complete: 2 days

## Page-by-Page Audit Results

### Admin Dashboard Page
- Status: 100% complete
- Hardcoded items: 
  - "Lỗi tải dữ liệu", "Không thể tải thống kê dashboard"
  - Action cards ("Quản lý bài học", "Bulk import", "Xem public site")
  - Health snapshot labels ("Lesson content", "Learner activity")
  - "Admin command center", "Dashboard"
  - Section headers ("Việc nên kiểm tra", "Health snapshot", "Hoạt động gần đây", "Bài nộp lỗi gần nhất")
- CMS items: None
- Editable items: None
- Recommendation: [Priority 4, High Effort] Admin UI is purely for internal staff. Moving this to CMS is not necessary unless multi-language admin dashboard is required. 

### Admin Lessons Page
- Status: 100% complete
- Hardcoded items:
  - "Lessons trong chapter", "Cần kiểm tra", "Thiếu test case"
  - Table headers ("Lesson", "Quality", "Validation", "Actions")
  - Action buttons ("Tạo lesson", "Refresh")
  - Status labels ("Ready", "Thiếu title", "Thiếu test case")
  - Confirmation dialog ("Xóa lesson...? Hành động này không thể hoàn tác.")
- CMS items: None
- Editable items: None
- Recommendation: [Priority 4, High Effort] Leave hardcoded. Admin interface does not benefit much from CMS content management.

## Content Dependencies

### Shared Content
- Error states and button terminologies are shared across admin pages.
- Data models (AdminLesson, DashboardStats) dictate dynamic content rendering.

## Migration Recommendations

### Priority 4 (Low Impact or High Effort)
- Admin UI Texts: Việc đưa nội dung của trang Admin vào CMS mang lại giá trị rất thấp vì người dùng là nội bộ và thường chỉ cần một ngôn ngữ (Tiếng Việt hoặc Tiếng Anh). Ưu tiên giữ hardcoded để code base đơn giản.

## Content That Cannot Be Managed via CMS
- Dynamic counts (Total users, lessons, submissions)
- User-generated actions and content health stats.
