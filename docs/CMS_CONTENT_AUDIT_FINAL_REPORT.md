# CMS Content Audit Final Report

## Executive Summary
This report aggregates the findings from all individual page audits conducted across the Loopy application. The goal is to provide a unified view of content that needs to be migrated to the CMS or managed via i18n, along with prioritized recommendations.

- **Overall Status**: Audit completed for 100% of application pages.
- **Predominant Finding**: Most static content (titles, descriptions, CTA buttons) is hardcoded in React components. Some sections utilize i18n for multi-language support (e.g., PvP pages, parts of Landing Page).
- **Editable Content**: Currently, very few static UI elements are editable via CMS. The CMS primarily handles lesson data, chapters, and challenges.

## Content Categorization

1. **Hardcoded Text**: 
   - Landing page hero, features, stats, FAQ.
   - Header/Footer navigation links and metadata.
   - Page titles and structural labels (Library, Learn, Playground, Docs, Onboarding, Settings).
2. **i18n Managed Content**:
   - PvP modes, difficulties, matchmaking status.
3. **Dynamic / Non-CMS Content**:
   - User progress, points, match results, real-time feedback.
   - Admin dashboards metrics.

## Content Dependencies
- **Shared Content**: Navigation links (Header, Footer), standard Action buttons ("Tiếp tục", "Hoàn thành", "Lưu").
- **Language Variants**: Currently, the system assumes a primary Vietnamese audience with partial English support via i18n. Full CMS migration requires supporting dual-language (VI/EN) fields for all content blocks.

## Prioritized Migration Recommendations

### Priority 1: High Impact, Low Effort (Start Here)
- **Landing Page Hero & CTA**: These are the first things users see. Migrating them to CMS allows marketing updates without deployments.
- **Header & Footer Links**: Easy to manage via a structured JSON or CMS block.

### Priority 2: High Impact, Medium Effort
- **Onboarding & Library Journey Maps**: Important for user conversion and engagement.
- **Languages Page Metadata**: Language names, descriptions, and difficulty badges.

### Priority 3: Medium Impact, Low Effort
- **Settings Page & Docs Page Structure**: Static layouts that rarely change but are good to have in CMS for typo fixes.
- **PvP Lobby Labels**: Mostly handled by i18n; consider keeping in i18n unless marketing changes are frequent.

### Priority 4: Low Impact or High Effort (De-prioritize)
- **Admin Pages**: Keep hardcoded. Internal tools do not need CMS overhead.
- **Playground & Learn Page Action Buttons**: Deeply integrated into the app logic; changing button text dynamically might cause UI/UX inconsistencies.

## Next Steps
1. Review this final report with the development and product teams.
2. Setup the necessary Database Tables (`content_items`, `content_blocks`) or extend the existing schema to support the Priority 1 items.
3. Implement a caching layer for CMS queries to prevent performance degradation on the Landing Page.
4. Begin migration of Priority 1 items.
