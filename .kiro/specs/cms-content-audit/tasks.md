  # Implementation Plan: CMS Content Audit

## Overview

Kế hoạch thực hiện audit toàn bộ nội dung CMS của ứng dụng Loopy, bao gồm 4 phase:

1. **Phase 1: Landing Page Audit** (6 tasks, ~6 hours)
   - Kiểm tra hero section, CTA buttons, features, stats, FAQ
   - Tóm tắt kết quả audit

2. **Phase 2: Header & Footer Audit** (6 tasks, ~4.5 hours)
   - Kiểm tra navigation, user menu, footer links, text sections, social links
   - Tóm tắt kết quả audit

3. **Phase 3: Main Pages Audit** (9 tasks, ~15 hours)
   - Kiểm tra 9 trang chính: Languages, Library, Learn, Playground, Docs, Onboarding, Settings, PvP, Admin
   - Tóm tắt kết quả audit cho mỗi trang

4. **Phase 4: Analysis & Report** (6 tasks, ~11 hours)
   - Phân tích dependencies, categorize content, generate report, prioritize items
   - Finalize audit report

**Total Effort**: ~40 hours
**Total Tasks**: 36

## Tasks

### Phase 1: Landing Page Audit

- [x] 1. Audit Landing Page Hero Section
  - Check hero title (hardcoded vs CMS)
  - Check hero subtitle (hardcoded vs CMS)
  - Check hero description (hardcoded vs CMS)
  - Check hero background image/video
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 2. Audit Landing Page CTA Buttons
  - Check primary CTA button text
  - Check secondary CTA button text
  - Check tertiary CTA button text
  - Check button links/actions
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 3. Audit Landing Page Features Section
  - Check feature card titles
  - Check feature card descriptions
  - Check feature card icons/labels
  - Check feature count and order
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 4. Audit Landing Page Stats Section
  - Check stats labels
  - Check stats numbers/values
  - Check stats descriptions
  - Check stats icons
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 5. Audit Landing Page FAQ Section
  - Check FAQ questions
  - Check FAQ answers
  - Check FAQ count and order
  - Check FAQ expand/collapse behavior
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 6. Summarize Landing Page Audit
  - Count hardcoded items
  - Count CMS items
  - Count editable items
  - Provide recommendation (priority, effort)
  - Add to audit report
  - **Effort**: 30 minutes

### Phase 2: Header & Footer Audit

- [x] 7. Audit Header Navigation
  - Check nav link texts
  - Check nav link order
  - Check nav link targets
  - Check logo/branding text
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 8. Audit Header User Menu
  - Check user menu items (profile, settings, logout)
  - Check menu item texts
  - Check menu item actions
  - Document findings in audit report
  - **Effort**: 30 minutes

- [x] 9. Audit Footer Links
  - Check footer link texts
  - Check footer link targets
  - Check footer link categories
  - Check footer link order
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 10. Audit Footer Text Sections
  - Check company info text
  - Check copyright text
  - Check disclaimer text
  - Check footer descriptions
  - Document findings in audit report
  - **Effort**: 1 hour

- [x] 11. Audit Footer Social Links
  - Check social media links
  - Check social media icons
  - Check social media order
  - Document findings in audit report
  - **Effort**: 30 minutes

- [x] 12. Summarize Header & Footer Audit
  - Count hardcoded items
  - Count CMS items
  - Count editable items
  - Provide recommendation (priority, effort)
  - Add to audit report
  - **Effort**: 30 minutes

### Phase 3: Main Pages Audit

- [x] 13. Audit Languages Page
  - Check page title and subtitle
  - Check language card titles
  - Check language card descriptions
  - Check language card icons
  - Check CTA buttons
  - Check metadata (language count, course count)
  - Document findings in audit report
  - **Effort**: 2 hours

- [x] 14. Audit Library Page
  - Check page title and subtitle
  - Check journey map section
  - Check next-step card
  - Check course/lesson cards
  - Check progress indicator labels
  - Document findings in audit report
  - **Effort**: 2 hours

- [x] 15. Audit Learn Page
  - Check action button texts (run, check, complete)
  - Check status labels and messages
  - Check mentor panel text
  - Check error messages and hints
  - Check lesson navigation
  - Document findings in audit report
  - **Effort**: 2 hours

- [x] 16. Audit Playground Page
  - Check page title and subtitle
  - Check page description
  - Check action button labels
  - Check status messages
  - Document findings in audit report
  - **Effort**: 1.5 hours

- [x] 17. Audit Docs Page
  - Check page title and subtitle
  - Check left navigation items
  - Check article body content
  - Check right TOC structure
  - Check inline links
  - Document findings in audit report
  - **Effort**: 2 hours

- [x] 18. Audit Onboarding Page
  - Check step titles and descriptions
  - Check form labels and placeholders
  - Check CTA buttons
  - Check validation messages
  - Check progress indicators
  - Document findings in audit report
  - **Effort**: 2 hours

- [x] 19. Audit Settings Page
  - Check section titles and descriptions
  - Check form labels and placeholders
  - Check button labels
  - Check validation messages
  - Check toggle/switch labels
  - Document findings in audit report
  - **Effort**: 1.5 hours

- [x] 20. Audit PvP Pages
  - Check mode names
  - Check difficulty names
  - Check mode descriptions
  - Check CTA buttons
  - Check status messages
  - Document findings in audit report
  - **Effort**: 1.5 hours

- [x] 21. Audit Admin Pages
  - Check page titles and section headers
  - Check table column headers
  - Check button labels
  - Check form labels
  - Check validation messages
  - Check confirmation dialogs
  - Document findings in audit report
  - **Effort**: 2 hours

### Phase 4: Analysis & Report

- [x] 22. Analyze Content Dependencies
  - Identify shared content (appears on multiple pages)
  - Identify linked content (depends on other content)
  - Identify language variants (EN, VI)
  - Identify conditional rendering
  - Document dependencies in audit report
  - **Effort**: 2 hours

- [x] 23. Categorize Content
  - Classify content by type (text, link, button, label, message, description)
  - Classify content by status (hardcoded, in-cms, editable)
  - Classify content by frequency (rarely, occasionally, frequently)
  - Classify content by audience (public, admin, user)
  - Document categorization in audit report
  - **Effort**: 2 hours

- [x] 24. Generate Audit Report
  - Compile all page audit findings
  - Create executive summary
  - Create page-by-page results
  - Create content dependencies section
  - Create migration recommendations
  - Create next steps section
  - **Effort**: 3 hours

- [x] 25. Prioritize Migration Items
  - Identify Priority 1 items (high impact, low effort)
  - Identify Priority 2 items (high impact, medium effort)
  - Identify Priority 3 items (medium impact, low effort)
  - Identify Priority 4 items (low impact or high effort)
  - Estimate effort for each priority level
  - Document in audit report
  - **Effort**: 2 hours

- [x] 26. Identify Non-CMS Content
  - Identify dynamic content (user data, progress, scores)
  - Identify user-generated content
  - Identify real-time data (notifications, messages)
  - Document limitations in audit report
  - **Effort**: 1 hour

- [x] 27. Review & Finalize Audit Report
  - Review audit report for completeness
  - Verify all pages are covered
  - Verify all content items are documented
  - Verify recommendations are clear
  - Finalize audit report
  - Prepare for team review
  - **Effort**: 1 hour

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 7, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      "description": "Independent audit tasks for different pages"
    },
    {
      "wave": 2,
      "tasks": [2, 3, 4, 5, 8, 9, 10, 11],
      "description": "Dependent tasks within Phase 1 and Phase 2"
    },
    {
      "wave": 3,
      "tasks": [6, 12],
      "description": "Summary tasks for Phase 1 and Phase 2"
    },
    {
      "wave": 4,
      "tasks": [22, 23],
      "description": "Analysis and categorization tasks"
    },
    {
      "wave": 5,
      "tasks": [24, 25, 26],
      "description": "Report generation and prioritization"
    },
    {
      "wave": 6,
      "tasks": [27],
      "description": "Final review and finalization"
    }
  ],
  "dependencies": {
    "1": [],
    "2": [1],
    "3": [2],
    "4": [3],
    "5": [4],
    "6": [5],
    "7": [],
    "8": [7],
    "9": [8],
    "10": [9],
    "11": [10],
    "12": [11],
    "13": [],
    "14": [],
    "15": [],
    "16": [],
    "17": [],
    "18": [],
    "19": [],
    "20": [],
    "21": [],
    "22": [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    "23": [22],
    "24": [23],
    "25": [24],
    "26": [25],
    "27": [26]
  }
}
```

## Notes

- **Audit Methodology**: Manual page-by-page audit using checklist template
- **Documentation**: All findings must be documented in the audit report
- **Classification**: Each content item must be classified by type, status, frequency, and audience
- **Dependencies**: All content dependencies must be identified and documented
- **Report Format**: Comprehensive audit report with executive summary, page-by-page results, dependencies, and recommendations
- **Success Criteria**: 100% page coverage, all content items documented, prioritized migration list created
