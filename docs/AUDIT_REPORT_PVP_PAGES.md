# CMS Content Audit Report

## Executive Summary
- Total content items audited: 25
- Hardcoded items: 15 (60%)
- Items in CMS (i18n): 10 (40%)
- Editable items: 0 (0%)
- Estimated effort to complete: 1.5 days

## Page-by-Page Audit Results

### PvP Lobby Page
- Status: 100% complete
- Hardcoded items: 
  - "Hoàn thành bài học đầu tiên để mở khóa thử thách."
  - "Thử thách nhanh sau bài học."
  - "PvP giúp bạn luyện phản xạ..."
  - "Chọn kiểu thử thách"
  - Mode descriptions ("Một vòng nhanh...", "Sắp có...")
  - "Độ khó đề xuất"
  - "Bắt đầu thử thách 1v1"
  - Feature titles and descriptions (Realtime, Theo kỹ năng, Ôn sau trận)
- CMS items (via i18n): 
  - Mode names (pvp.duel)
  - Difficulties (pvp.easy, pvp.medium, pvp.hard)
  - pvp.joinRoom, pvp.searching, pvp.joining
- Editable items: None
- Recommendation: [Priority 3, Low Effort] Di chuyển các đoạn text hardcode sang i18n hoặc CMS nếu cần chỉnh sửa nội dung sau này.

### PvP Match Page
- Status: 100% complete
- Hardcoded items:
  - "Không tìm thấy phòng đấu"
  - "Phòng có thể đã kết thúc hoặc mã phòng không đúng..."
- CMS items (via i18n):
  - pvp.match.started, pvp.match.newQuestion, pvp.match.completed
  - pvp.match.playerJoined, pvp.match.playerLeft
  - pvp.match.paused, pvp.match.resumed, pvp.match.forfeit
- Editable items: None
- Recommendation: [Priority 3, Low Effort] Move the hardcoded "Not found" messages to i18n translations.

## Content Dependencies

### Shared Content
- Mode names and difficulties are shared across lobby and match logic.
- Toast error messages rely on server responses or local i18n.

### Language Variants
- `i18n` is currently used, providing support for multiple languages, but static texts are exclusively in Vietnamese.

## Migration Recommendations

### Priority 3 (Medium Impact, Low Effort)
- Hardcoded labels in PvP Lobby (Mode descriptions, Hero texts): Di chuyển sang hệ thống i18n hoặc CMS để đảm bảo tính nhất quán ngôn ngữ.

## Content That Cannot Be Managed via CMS
- Real-time match data (scores, questions, countdown timers).
- Socket connection states and dynamic user presence.
