# Requirements Document

## Overview: Audit & Complete CMS Content Coverage

Loopy cần audit toàn bộ ứng dụng để xác định trạng thái nội dung trên từng trang. Mục tiêu là tạo danh sách chi tiết về:
1. Dữ liệu nào là hardcoded (cần thêm vào CMS)
2. Dữ liệu nào đã có trong CMS
3. Dữ liệu nào có thể chỉnh sửa được (editable content)
4. Khuyến nghị cho từng trang

Kết quả audit sẽ là một báo cáo toàn diện giúp xác định scope công việc để hoàn thành CMS coverage.

## Introduction

Loopy cần audit toàn bộ ứng dụng để xác định trạng thái nội dung trên từng trang. Mục tiêu là tạo danh sách chi tiết về:
1. Dữ liệu nào là hardcoded (cần thêm vào CMS)
2. Dữ liệu nào đã có trong CMS
3. Dữ liệu nào có thể chỉnh sửa được (editable content)
4. Khuyến nghị cho từng trang

Kết quả audit sẽ là một báo cáo toàn diện giúp xác định scope công việc để hoàn thành CMS coverage.

## Glossary

- **Hardcoded Content**: Dữ liệu được viết trực tiếp trong code (JSX, component, constants), không thể chỉnh sửa qua admin UI
- **CMS Content**: Dữ liệu được lưu trong database (content_items table) và có thể quản lý qua admin UI
- **Editable Content**: Dữ liệu có thể chỉnh sửa được thông qua admin UI hoặc CMS
- **Content Item**: Một đơn vị nội dung trong CMS, bao gồm key, category, language, value, description
- **Content Category**: Phân loại nội dung (header, footer, landing, languages, library, learn, playground, docs, onboarding, settings, pvp, admin)
- **Audit Report**: Tài liệu chi tiết liệt kê trạng thái nội dung của từng trang
- **App Pages**: Các trang chính trong ứng dụng (landing, languages, library, learn, playground, docs, onboarding, settings, pvp, admin)
- **Static Content**: Nội dung không thay đổi thường xuyên (titles, labels, descriptions, CTA buttons)
- **Dynamic Content**: Nội dung thay đổi dựa trên user data hoặc state (progress, scores, user info)

## Requirements

### Requirement 1: Audit Landing Page Content

**User Story:** As an admin, I want to audit the landing page content, so that I can identify which content is hardcoded and needs to be added to CMS.

#### Acceptance Criteria

1. WHEN auditing the landing page, THE Auditor SHALL identify all static text elements in hero section (title, subtitle, description)
2. WHEN auditing the landing page, THE Auditor SHALL identify all CTA buttons (primary, secondary, tertiary) and their text
3. WHEN auditing the landing page, THE Auditor SHALL identify all feature cards (title, description, icon labels)
4. WHEN auditing the landing page, THE Auditor SHALL identify all statistics/stats section (labels, numbers, descriptions)
5. WHEN auditing the landing page, THE Auditor SHALL identify all FAQ items (questions, answers)
6. WHEN auditing the landing page, THE Auditor SHALL document which content is currently hardcoded vs in CMS
7. WHEN auditing the landing page, THE Auditor SHALL document which content is currently editable via admin UI

### Requirement 2: Audit Header and Footer Content

**User Story:** As an admin, I want to audit header and footer content, so that I can ensure navigation and links are properly managed.

#### Acceptance Criteria

1. WHEN auditing header, THE Auditor SHALL identify all navigation links (text, href, order)
2. WHEN auditing header, THE Auditor SHALL identify all logo/branding text
3. WHEN auditing header, THE Auditor SHALL identify all user menu items (profile, settings, logout)
4. WHEN auditing footer, THE Auditor SHALL identify all footer links (text, href, category)
5. WHEN auditing footer, THE Auditor SHALL identify all footer text sections (company info, copyright, disclaimer)
6. WHEN auditing footer, THE Auditor SHALL identify all social media links
7. WHEN auditing header and footer, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 3: Audit Languages Page Content

**User Story:** As an admin, I want to audit the languages page, so that I can ensure all language cards and descriptions are properly managed.

#### Acceptance Criteria

1. WHEN auditing languages page, THE Auditor SHALL identify all language cards (title, description, icon, difficulty level)
2. WHEN auditing languages page, THE Auditor SHALL identify page title and subtitle
3. WHEN auditing languages page, THE Auditor SHALL identify all CTA buttons and their text
4. WHEN auditing languages page, THE Auditor SHALL identify all metadata (language count, course count, estimated time)
5. WHEN auditing languages page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 4: Audit Library Page Content

**User Story:** As an admin, I want to audit the library page, so that I can ensure journey map and next-step content are properly managed.

#### Acceptance Criteria

1. WHEN auditing library page, THE Auditor SHALL identify page title and subtitle
2. WHEN auditing library page, THE Auditor SHALL identify journey map section (title, description, step labels)
3. WHEN auditing library page, THE Auditor SHALL identify next-step card (title, description, CTA button)
4. WHEN auditing library page, THE Auditor SHALL identify all course/lesson cards (title, description, progress indicator labels)
5. WHEN auditing library page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 5: Audit Learn Page Content

**User Story:** As an admin, I want to audit the learn page, so that I can ensure all buttons, labels, and mentor panel text are properly managed.

#### Acceptance Criteria

1. WHEN auditing learn page, THE Auditor SHALL identify all action buttons (run code, check changes, run result, check debug, complete lesson)
2. WHEN auditing learn page, THE Auditor SHALL identify all status labels and messages
3. WHEN auditing learn page, THE Auditor SHALL identify mentor panel text (title, description, tips)
4. WHEN auditing learn page, THE Auditor SHALL identify all error messages and hints
5. WHEN auditing learn page, THE Auditor SHALL identify lesson navigation (previous, next, back to library)
6. WHEN auditing learn page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 6: Audit Playground Page Content

**User Story:** As an admin, I want to audit the playground page, so that I can ensure title, subtitle, and description are properly managed.

#### Acceptance Criteria

1. WHEN auditing playground page, THE Auditor SHALL identify page title and subtitle
2. WHEN auditing playground page, THE Auditor SHALL identify page description and instructions
3. WHEN auditing playground page, THE Auditor SHALL identify all action buttons and their labels
4. WHEN auditing playground page, THE Auditor SHALL identify all status messages and hints
5. WHEN auditing playground page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 7: Audit Docs Page Content

**User Story:** As an admin, I want to audit the docs page, so that I can ensure documentation structure and content are properly managed.

#### Acceptance Criteria

1. WHEN auditing docs page, THE Auditor SHALL identify page title and subtitle
2. WHEN auditing docs page, THE Auditor SHALL identify left navigation items (category, subcategory, article links)
3. WHEN auditing docs page, THE Auditor SHALL identify article body content (headings, paragraphs, code blocks, links)
4. WHEN auditing docs page, THE Auditor SHALL identify right TOC (table of contents) structure
5. WHEN auditing docs page, THE Auditor SHALL identify all inline links and their targets
6. WHEN auditing docs page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 8: Audit Onboarding Page Content

**User Story:** As an admin, I want to audit the onboarding page, so that I can ensure step titles, descriptions, and CTAs are properly managed.

#### Acceptance Criteria

1. WHEN auditing onboarding page, THE Auditor SHALL identify all step titles and descriptions
2. WHEN auditing onboarding page, THE Auditor SHALL identify all form labels and placeholders
3. WHEN auditing onboarding page, THE Auditor SHALL identify all CTA buttons and their text
4. WHEN auditing onboarding page, THE Auditor SHALL identify all validation messages and error messages
5. WHEN auditing onboarding page, THE Auditor SHALL identify all progress indicators and labels
6. WHEN auditing onboarding page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 9: Audit Settings Page Content

**User Story:** As an admin, I want to audit the settings page, so that I can ensure section titles, labels, and form elements are properly managed.

#### Acceptance Criteria

1. WHEN auditing settings page, THE Auditor SHALL identify all section titles and descriptions
2. WHEN auditing settings page, THE Auditor SHALL identify all form labels and placeholders
3. WHEN auditing settings page, THE Auditor SHALL identify all button labels (save, cancel, delete, reset)
4. WHEN auditing settings page, THE Auditor SHALL identify all validation messages and success messages
5. WHEN auditing settings page, THE Auditor SHALL identify all toggle/switch labels
6. WHEN auditing settings page, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 10: Audit PvP Pages Content

**User Story:** As an admin, I want to audit PvP pages, so that I can ensure mode names, difficulty levels, and descriptions are properly managed.

#### Acceptance Criteria

1. WHEN auditing PvP pages, THE Auditor SHALL identify all mode names (duel, battle royale, etc.)
2. WHEN auditing PvP pages, THE Auditor SHALL identify all difficulty names (easy, medium, hard, etc.)
3. WHEN auditing PvP pages, THE Auditor SHALL identify all mode descriptions and rules
4. WHEN auditing PvP pages, THE Auditor SHALL identify all CTA buttons and their text
5. WHEN auditing PvP pages, THE Auditor SHALL identify all status messages and notifications
6. WHEN auditing PvP pages, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 11: Audit Admin Pages Content

**User Story:** As an admin, I want to audit admin pages, so that I can ensure all labels, buttons, and messages are properly managed.

#### Acceptance Criteria

1. WHEN auditing admin pages, THE Auditor SHALL identify all page titles and section headers
2. WHEN auditing admin pages, THE Auditor SHALL identify all table column headers and labels
3. WHEN auditing admin pages, THE Auditor SHALL identify all button labels (create, edit, delete, save, cancel)
4. WHEN auditing admin pages, THE Auditor SHALL identify all form labels and placeholders
5. WHEN auditing admin pages, THE Auditor SHALL identify all validation messages and error messages
6. WHEN auditing admin pages, THE Auditor SHALL identify all confirmation dialogs and messages
7. WHEN auditing admin pages, THE Auditor SHALL document which content is hardcoded vs in CMS

### Requirement 12: Generate Comprehensive Audit Report

**User Story:** As a project manager, I want to receive a comprehensive audit report, so that I can understand the scope of work needed to complete CMS coverage.

#### Acceptance Criteria

1. WHEN audit is complete, THE Auditor SHALL generate a report listing all hardcoded content items by page
2. WHEN audit is complete, THE Auditor SHALL generate a report listing all CMS content items by page
3. WHEN audit is complete, THE Auditor SHALL generate a report listing all editable content items by page
4. WHEN audit is complete, THE Auditor SHALL provide recommendations for each page (priority, effort estimate, dependencies)
5. WHEN audit is complete, THE Auditor SHALL provide a summary of total hardcoded items, CMS items, and editable items
6. WHEN audit is complete, THE Auditor SHALL provide a prioritized list of pages to migrate to CMS
7. WHEN audit is complete, THE Auditor SHALL document any content that cannot be managed via CMS (dynamic content, user-generated content)

### Requirement 13: Identify Content Dependencies and Relationships

**User Story:** As a developer, I want to understand content dependencies, so that I can plan the migration strategy correctly.

#### Acceptance Criteria

1. WHEN analyzing content, THE Auditor SHALL identify content that appears on multiple pages (shared content)
2. WHEN analyzing content, THE Auditor SHALL identify content that depends on other content (linked content)
3. WHEN analyzing content, THE Auditor SHALL identify content that has language variants (EN, VI)
4. WHEN analyzing content, THE Auditor SHALL identify content that has conditional rendering (shown based on user state)
5. WHEN analyzing content, THE Auditor SHALL document all dependencies in the audit report

### Requirement 14: Categorize Content by Type and Editability

**User Story:** As an admin, I want to understand content categorization, so that I can plan the CMS structure correctly.

#### Acceptance Criteria

1. WHEN categorizing content, THE Auditor SHALL classify content by type (text, link, button, label, message, description)
2. WHEN categorizing content, THE Auditor SHALL classify content by editability (static, semi-static, dynamic)
3. WHEN categorizing content, THE Auditor SHALL classify content by frequency of change (rarely, occasionally, frequently)
4. WHEN categorizing content, THE Auditor SHALL classify content by audience (public, admin, user)
5. WHEN categorizing content, THE Auditor SHALL document categorization in the audit report

