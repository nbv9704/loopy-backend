# Design Document

## Overview

Audit CMS content coverage bằng cách kiểm tra từng trang, từng mục để xác định:
1. Dữ liệu nào là hardcoded (cần thêm vào CMS)
2. Dữ liệu nào đã có trong CMS
3. Dữ liệu nào có thể chỉnh sửa được

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Audit Process                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Phase 1: Page Audit          Phase 2: Classification        │
│  ├─ Landing Page              ├─ By Type                     │
│  ├─ Header/Footer             ├─ By Status                   │
│  ├─ Languages Page            ├─ By Frequency               │
│  ├─ Library Page              └─ By Audience                │
│  ├─ Learn Page                                               │
│  ├─ Playground Page           Phase 3: Dependency Analysis   │
│  ├─ Docs Page                 ├─ Shared Content             │
│  ├─ Onboarding Page           ├─ Linked Content             │
│  ├─ Settings Page             ├─ Language Variants          │
│  ├─ PvP Pages                 └─ Conditional Rendering      │
│  └─ Admin Pages                                              │
│                                Phase 4: Report Generation    │
│                                ├─ Audit Report              │
│                                ├─ Migration List            │
│                                └─ Recommendations           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Audit Flow

1. **Input**: App pages (frontend code, components)
2. **Process**: Manual audit using checklist template
3. **Output**: Audit report with findings and recommendations

### Data Flow

```
Frontend Pages
    ↓
Audit Checklist
    ↓
Content Classification
    ↓
Dependency Analysis
    ↓
Audit Report
    ↓
Migration Recommendations
```

## Components and Interfaces

### Audit Checklist Component

**Purpose**: Template để kiểm tra từng trang

**Interface**:
```
AuditChecklist {
  pageName: string
  url: string
  contentItems: ContentItem[]
  summary: AuditSummary
}

ContentItem {
  id: string
  description: string
  status: 'hardcoded' | 'in-cms' | 'editable'
  type: 'text' | 'link' | 'button' | 'label' | 'message' | 'description'
  frequency: 'rarely' | 'occasionally' | 'frequently'
  languages: ('vi' | 'en')[]
  notes: string
}

AuditSummary {
  totalItems: number
  hardcodedItems: number
  cmsItems: number
  editableItems: number
  recommendation: string
}
```

### Audit Report Component

**Purpose**: Tổng hợp kết quả audit từ tất cả các trang

**Interface**:
```
AuditReport {
  executiveSummary: ExecutiveSummary
  pageResults: PageAuditResult[]
  contentDependencies: ContentDependency[]
  migrationRecommendations: MigrationRecommendation[]
  nextSteps: string[]
}

ExecutiveSummary {
  totalItems: number
  hardcodedItems: number
  cmsItems: number
  editableItems: number
  completionPercentage: number
  estimatedEffort: string
}

PageAuditResult {
  pageName: string
  status: number // percentage
  hardcodedItems: string[]
  cmsItems: string[]
  editableItems: string[]
  recommendation: string
}

ContentDependency {
  type: 'shared' | 'linked' | 'language-variant' | 'conditional'
  items: string[]
  description: string
}

MigrationRecommendation {
  priority: 1 | 2 | 3 | 4
  items: string[]
  reason: string
  estimatedEffort: string
}
```

## Data Models

### Content Item Model

```
ContentItem {
  id: UUID
  key: string (e.g., "nav.learn", "landing.hero.title")
  category: string (header, footer, landing, languages, library, learn, playground, docs, onboarding, settings, pvp, admin)
  type: 'text' | 'link' | 'button' | 'label' | 'message' | 'description'
  status: 'hardcoded' | 'in-cms' | 'editable'
  frequency: 'rarely' | 'occasionally' | 'frequently'
  languages: ('vi' | 'en')[]
  value: string (current value in code or CMS)
  location: string (file path, component name)
  notes: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Audit Report Model

```
AuditReport {
  id: UUID
  createdAt: timestamp
  updatedAt: timestamp
  status: 'in-progress' | 'completed' | 'reviewed'
  
  summary: {
    totalItems: number
    hardcodedItems: number
    cmsItems: number
    editableItems: number
    completionPercentage: number
    estimatedEffort: string
  }
  
  pageResults: PageAuditResult[]
  contentDependencies: ContentDependency[]
  migrationRecommendations: MigrationRecommendation[]
  
  notes: string
  reviewedBy: string (optional)
  approvedAt: timestamp (optional)
}
```

### Page Audit Result Model

```
PageAuditResult {
  pageName: string
  url: string
  status: number (0-100 percentage)
  
  items: {
    hardcoded: ContentItem[]
    inCms: ContentItem[]
    editable: ContentItem[]
  }
  
  summary: {
    total: number
    hardcoded: number
    inCms: number
    editable: number
  }
  
  recommendation: {
    priority: 1 | 2 | 3 | 4
    reason: string
    estimatedEffort: string
    notes: string
  }
}
```

## Correctness Properties

### Property 1: Audit Completeness
All pages must be audited and documented in the final report.
- **Verification**: Check that all 11 pages have audit results
- **Failure Condition**: Missing page audit results
- **Validates: Requirements 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0**

### Property 2: Content Classification Consistency
Each content item must have consistent and valid classification values.
- **Verification**: Check that status, type, frequency are valid values
- **Failure Condition**: Invalid or missing classification values
- **Validates: Requirements 14.0**

### Property 3: Dependency Accuracy
All dependencies must be correctly identified and documented.
- **Verification**: Cross-reference shared content across pages
- **Failure Condition**: Missing or incorrect dependency relationships
- **Validates: Requirements 13.0**

### Property 4: Language Coverage
All language variants must be identified and documented.
- **Verification**: Check that VI and EN versions are documented
- **Failure Condition**: Missing language variant documentation
- **Validates: Requirements 13.0**

## Error Handling

### Missing Content Items
- **Error**: Content item not found in code or CMS
- **Handling**: Document as "unknown" and flag for investigation
- **Recovery**: Manual review and verification

### Inconsistent Classifications
- **Error**: Content item has conflicting classifications
- **Handling**: Flag for review and clarification
- **Recovery**: Manual review by team

### Incomplete Audit
- **Error**: Some pages not fully audited
- **Handling**: Document incomplete sections and reasons
- **Recovery**: Schedule follow-up audit

### Dependency Conflicts
- **Error**: Circular dependencies or conflicting relationships
- **Handling**: Document conflicts and flag for resolution
- **Recovery**: Manual analysis and decision

## Testing Strategy

### Audit Verification
1. **Completeness Check**: Verify all pages are audited
2. **Consistency Check**: Verify classifications are consistent
3. **Accuracy Check**: Verify findings match actual code
4. **Dependency Check**: Verify dependencies are correct

### Report Validation
1. **Summary Accuracy**: Verify counts match actual items
2. **Recommendation Validity**: Verify recommendations are actionable
3. **Effort Estimation**: Verify effort estimates are reasonable
4. **Priority Ranking**: Verify priority ranking is logical

### Manual Testing
1. **Page-by-Page Review**: Manually verify audit findings for each page
2. **Code Inspection**: Inspect actual code to verify hardcoded items
3. **CMS Verification**: Verify items in CMS database
4. **Team Review**: Have team review and approve audit report

## Audit Methodology

### Phase 1: Page-by-Page Audit
Kiểm tra từng trang chính của app:
- Landing page
- Header/Footer
- Languages page
- Library page
- Learn page
- Playground page
- Docs page
- Onboarding page
- Settings page
- PvP pages
- Admin pages

### Phase 2: Content Classification
Phân loại nội dung theo:
- **Type**: text, link, button, label, message, description
- **Status**: hardcoded, in-cms, editable
- **Frequency**: rarely, occasionally, frequently changed
- **Audience**: public, admin, user

### Phase 3: Dependency Analysis
Xác định:
- Shared content (xuất hiện trên nhiều trang)
- Linked content (phụ thuộc vào content khác)
- Language variants (EN, VI)
- Conditional rendering (hiển thị dựa trên state)

### Phase 4: Report Generation
Tạo báo cáo bao gồm:
- Danh sách hardcoded items cần thêm vào CMS
- Danh sách items đã có trong CMS
- Danh sách editable items
- Khuyến nghị cho từng trang
- Prioritized migration list

## Audit Checklist Template

Cho mỗi trang, kiểm tra:

```
Page: [Page Name]
URL: [URL]

Content Items:
- [ ] Item 1: [Description]
  - Status: hardcoded | in-cms | editable
  - Type: text | link | button | label | message | description
  - Frequency: rarely | occasionally | frequently
  - Languages: vi | en | both
  - Notes: [Any notes]

- [ ] Item 2: [Description]
  - Status: ...
  - Type: ...
  - Frequency: ...
  - Languages: ...
  - Notes: ...

Summary:
- Total items: X
- Hardcoded: X
- In CMS: X
- Editable: X
- Recommendation: [Priority, effort, notes]
```

## Content Categories

Dữ liệu sẽ được phân loại vào các category:

1. **header**: Navigation, logo, user menu
2. **footer**: Links, copyright, company info
3. **landing**: Hero, CTA, features, stats, FAQ
4. **languages**: Language cards, descriptions
5. **library**: Journey map, next-step card
6. **learn**: Buttons, labels, mentor panel
7. **playground**: Title, subtitle, description
8. **docs**: Title, nav, article, TOC
9. **onboarding**: Step titles, descriptions, CTA
10. **settings**: Section titles, labels, buttons
11. **pvp**: Mode names, difficulty levels, descriptions
12. **admin**: Labels, buttons, messages

## Audit Output Format

### Audit Report Structure

```markdown
# CMS Content Audit Report

## Executive Summary
- Total content items audited: X
- Hardcoded items: X (Y%)
- Items in CMS: X (Y%)
- Editable items: X (Y%)
- Estimated effort to complete: X days

## Page-by-Page Audit Results

### Landing Page
- Status: X% complete
- Hardcoded items: [list]
- CMS items: [list]
- Editable items: [list]
- Recommendation: [priority, effort, notes]

### Header/Footer
- Status: X% complete
- Hardcoded items: [list]
- CMS items: [list]
- Editable items: [list]
- Recommendation: [priority, effort, notes]

[... repeat for each page ...]

## Content Dependencies

### Shared Content
- [Item]: appears on [pages]
- [Item]: appears on [pages]

### Linked Content
- [Item]: depends on [other items]
- [Item]: depends on [other items]

### Language Variants
- [Item]: has VI and EN versions
- [Item]: has VI and EN versions

## Migration Recommendations

### Priority 1 (High Impact, Low Effort)
- [Item]: [reason]
- [Item]: [reason]

### Priority 2 (High Impact, Medium Effort)
- [Item]: [reason]
- [Item]: [reason]

### Priority 3 (Medium Impact, Low Effort)
- [Item]: [reason]
- [Item]: [reason]

### Priority 4 (Low Impact or High Effort)
- [Item]: [reason]
- [Item]: [reason]

## Content That Cannot Be Managed via CMS

- Dynamic content (user data, progress, scores)
- User-generated content
- Real-time data (notifications, messages)
- [Other items]

## Next Steps

1. Review audit report with team
2. Prioritize migration items
3. Create tasks for each priority level
4. Implement CMS content items
5. Update pages to use CMS content
6. Verify all content is properly managed
```

## Editable Content Features

Các loại content có thể chỉnh sửa được:

1. **Text Content**: Titles, descriptions, labels, messages
2. **Links**: Navigation links, footer links, documentation links
3. **Buttons**: CTA buttons, action buttons, form buttons
4. **Lists**: Feature lists, FAQ items, navigation items
5. **Metadata**: Page titles, descriptions, keywords

## Content Management Capabilities

Sau khi audit, các content items sẽ có thể:
- Chỉnh sửa qua admin UI (Content Manager)
- Export/import JSON
- Quản lý theo language (VI, EN)
- Audit trail (ai sửa, khi nào, thay đổi gì)
- Fallback to i18n nếu content không tìm thấy

## Risks & Considerations

1. **Performance**: Quá nhiều API calls để fetch content
   - Mitigation: Implement caching (5 min TTL)

2. **Stale Content**: Content không được update kịp thời
   - Mitigation: Cache invalidation, manual refresh

3. **Missing Content**: Một số content không được migrate
   - Mitigation: Fallback to i18n keys, default values

4. **Language Consistency**: EN/VI content không đồng bộ
   - Mitigation: Admin UI validation, audit logs

5. **Dynamic Content**: Không thể quản lý dynamic content via CMS
   - Mitigation: Document limitations, use appropriate storage

## Success Criteria

- [ ] Audit report hoàn thành với 100% coverage
- [ ] Tất cả hardcoded items được xác định
- [ ] Tất cả CMS items được xác định
- [ ] Tất cả editable items được xác định
- [ ] Dependencies được phân tích
- [ ] Prioritized migration list được tạo
- [ ] Effort estimate được cung cấp
- [ ] Team review và approve audit report
