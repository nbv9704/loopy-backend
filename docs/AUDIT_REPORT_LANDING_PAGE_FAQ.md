# Audit Report: Landing Page FAQ Section

**Date**: 2024
**Auditor**: Kiro Spec Task Execution Agent
**Task**: 5. Audit Landing Page FAQ Section
**Status**: Completed

---

## Executive Summary

The landing page FAQ section is located in the **V2LandingPage** (`/src/pages/v2/V2LandingPage.tsx`). The FAQ section contains **3 hardcoded Q&A items** that are not managed through the CMS. The section is currently **not expandable/collapsible** - all answers are displayed inline.

### Key Findings:
- **Total FAQ Items**: 3
- **Hardcoded Items**: 3 (100%)
- **CMS Items**: 0 (0%)
- **Editable Items**: 0 (0%)
- **Expand/Collapse Behavior**: Not implemented (static display)
- **Language Support**: Vietnamese only (no EN translation)
- **Route Status**: No dedicated `/faq` page route (footer links to `/faq` but route not implemented)

---

## Detailed Audit Findings

### 1. FAQ Section Location
- **File**: `d:\Loopy\loopy-frontend\src\pages\v2\V2LandingPage.tsx`
- **Section ID**: `faq`
- **Lines**: 165-180
- **Component**: Inline JSX in V2LandingPage component

### 2. FAQ Section Structure

```jsx
<section id="faq" className="bg-slate-950 px-4 py-16 text-white md:px-6">
  <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr,1.2fr]">
    <div>
      <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-teal">FAQ</div>
      <h2 className="mt-3 text-4xl font-black tracking-tight">V2 đang test điều gì?</h2>
    </div>
    <div className="grid gap-3">
      {/* FAQ items rendered here */}
    </div>
  </div>
</section>
```

### 3. FAQ Items Audit

#### Item 1: Route Change Question
- **Question (Hardcoded)**: "Route này có thay landing hiện tại không?"
- **Answer (Hardcoded)**: "Không. Đây là sandbox riêng để test visual trước khi thay route thật."
- **Status**: Hardcoded
- **Type**: Text (Q&A pair)
- **Language**: Vietnamese only
- **Frequency**: Static (unlikely to change frequently)
- **Audience**: Public
- **Location**: Line 173 in V2LandingPage.tsx

#### Item 2: Coddy Copy Question
- **Question (Hardcoded)**: "Có copy Coddy không?"
- **Answer (Hardcoded)**: "Không. Capture chỉ dùng làm reference về cấu trúc. Copy, asset và claim được viết lại cho Loopy."
- **Status**: Hardcoded
- **Type**: Text (Q&A pair)
- **Language**: Vietnamese only
- **Frequency**: Static (unlikely to change frequently)
- **Audience**: Public
- **Location**: Line 174 in V2LandingPage.tsx

#### Item 3: Next Priority Question
- **Question (Hardcoded)**: "Ưu tiên tiếp theo là gì?"
- **Answer (Hardcoded)**: "Sau landing, nên dựng v2 library/journey map rồi mới polish Learn."
- **Status**: Hardcoded
- **Type**: Text (Q&A pair)
- **Language**: Vietnamese only
- **Frequency**: Static (unlikely to change frequently)
- **Audience**: Public
- **Location**: Line 175 in V2LandingPage.tsx

### 4. FAQ Section Header

- **Section Label (Hardcoded)**: "FAQ"
- **Section Title (Hardcoded)**: "V2 đang test điều gì?" (What is V2 testing?)
- **Status**: Hardcoded
- **Type**: Text (section header)
- **Language**: Vietnamese only
- **Location**: Lines 168-170 in V2LandingPage.tsx

### 5. Expand/Collapse Behavior

**Current Implementation**: 
- FAQ items are displayed as **static cards** with no expand/collapse functionality
- All answers are visible by default
- No interactive state management
- No animation or transition effects

**Rendering Code**:
```jsx
{[
  ['Route này có thay landing hiện tại không?', 'Không. Đây là sandbox riêng để test visual trước khi thay route thật.'],
  ['Có copy Coddy không?', 'Không. Capture chỉ dùng làm reference về cấu trúc. Copy, asset và claim được viết lại cho Loopy.'],
  ['Ưu tiên tiếp theo là gì?', 'Sau landing, nên dựng v2 library/journey map rồi mới polish Learn.'],
].map(([question, answer]) => (
  <div key={question} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <h3 className="font-black">{question}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
  </div>
))}
```

**Status**: No expand/collapse behavior implemented

### 6. FAQ Section Styling

- **Background**: Dark (`bg-slate-950`)
- **Text Color**: White (`text-white`)
- **Layout**: Grid layout with 2 columns on medium+ screens (`md:grid-cols-[0.8fr,1.2fr]`)
- **Card Styling**: Rounded corners, subtle border, semi-transparent background
- **Typography**: 
  - Label: Small, uppercase, teal color
  - Title: Large, bold, black font
  - Questions: Bold, black font
  - Answers: Small, gray text

### 7. CMS Integration Status

**Current Status**: Not integrated with CMS
- No `useContentByKey` hook usage for FAQ items
- No database queries for FAQ content
- No language variant support (VI/EN)
- No admin UI for editing FAQ items

**Potential CMS Keys** (if migrated):
- `landing.faq.title` - "V2 đang test điều gì?"
- `landing.faq.label` - "FAQ"
- `landing.faq.item1.question` - "Route này có thay landing hiện tại không?"
- `landing.faq.item1.answer` - "Không. Đây là sandbox riêng để test visual trước khi thay route thật."
- `landing.faq.item2.question` - "Có copy Coddy không?"
- `landing.faq.item2.answer` - "Không. Capture chỉ dùng làm reference về cấu trúc. Copy, asset và claim được viết lại cho Loopy."
- `landing.faq.item3.question` - "Ưu tiên tiếp theo là gì?"
- `landing.faq.item3.answer` - "Sau landing, nên dựng v2 library/journey map rồi mới polish Learn."

### 8. Language Support

**Current Status**: Vietnamese only
- No English translations available
- No i18n keys defined for FAQ items
- No language variant in database

**Missing Translations**:
- All 3 FAQ items need English translations
- Section title needs English translation
- Section label needs English translation

### 9. Routing Issues

**Issue**: Footer links to `/faq` but no route is implemented
- **Footer Link**: `{ labelKey: 'footer.faq', path: '/faq' }`
- **Route Status**: Not defined in `AppRouter.tsx`
- **Current Behavior**: Clicking FAQ link in footer will result in 404 or no navigation
- **Impact**: Users cannot navigate to a dedicated FAQ page

### 10. Content Dependencies

**Shared Content**: None identified
- FAQ items are unique to landing page
- No FAQ content appears on other pages

**Linked Content**: None identified
- FAQ items do not reference other content items
- No conditional rendering based on user state

**Language Variants**: Not implemented
- Only Vietnamese version exists
- English version needed for i18n support

---

## Content Classification

| Item | Type | Status | Frequency | Audience | Language |
|------|------|--------|-----------|----------|----------|
| FAQ Label | Text | Hardcoded | Rarely | Public | VI |
| FAQ Title | Text | Hardcoded | Rarely | Public | VI |
| Q1: Route Change | Q&A | Hardcoded | Rarely | Public | VI |
| A1: Route Change | Q&A | Hardcoded | Rarely | Public | VI |
| Q2: Coddy Copy | Q&A | Hardcoded | Rarely | Public | VI |
| A2: Coddy Copy | Q&A | Hardcoded | Rarely | Public | VI |
| Q3: Next Priority | Q&A | Hardcoded | Rarely | Public | VI |
| A3: Next Priority | Q&A | Hardcoded | Rarely | Public | VI |

---

## Recommendations

### Priority 1: High Impact, Low Effort
1. **Migrate FAQ items to CMS**
   - Create content items for all 3 FAQ Q&A pairs
   - Use `landing.faq.item*.question` and `landing.faq.item*.answer` keys
   - Effort: 1-2 hours
   - Impact: Enables admin to edit FAQ without code changes

2. **Add English translations**
   - Translate all FAQ items to English
   - Add to i18n JSON files
   - Effort: 30 minutes
   - Impact: Supports bilingual users

### Priority 2: High Impact, Medium Effort
1. **Implement expand/collapse behavior**
   - Add state management for expanded/collapsed items
   - Add animation transitions
   - Improve UX for mobile devices
   - Effort: 2-3 hours
   - Impact: Better UX, reduces visual clutter

2. **Create dedicated FAQ page**
   - Create `/faq` route
   - Move FAQ section to dedicated page
   - Add more FAQ items if needed
   - Effort: 2-3 hours
   - Impact: Improves navigation, allows for more FAQ items

### Priority 3: Medium Impact, Low Effort
1. **Add FAQ schema markup**
   - Add JSON-LD structured data for FAQ
   - Improves SEO
   - Effort: 30 minutes
   - Impact: Better search engine visibility

2. **Add FAQ analytics**
   - Track which FAQ items are viewed/expanded
   - Track user interactions
   - Effort: 1 hour
   - Impact: Understand user questions

### Priority 4: Low Impact or High Effort
1. **Add FAQ search functionality**
   - Allow users to search FAQ items
   - Effort: 2-3 hours
   - Impact: Better UX for large FAQ lists

2. **Add FAQ categories**
   - Group FAQ items by category
   - Effort: 2-3 hours
   - Impact: Better organization for many items

---

## Issues & Blockers

### Issue 1: No Dedicated FAQ Page Route
- **Severity**: Medium
- **Description**: Footer links to `/faq` but route is not implemented
- **Impact**: Users cannot navigate to FAQ page from footer
- **Resolution**: Create `/faq` route and FAQ page component

### Issue 2: No Expand/Collapse Behavior
- **Severity**: Low
- **Description**: FAQ items are always expanded, no collapse option
- **Impact**: Visual clutter on mobile devices
- **Resolution**: Implement accordion-style expand/collapse

### Issue 3: No English Translations
- **Severity**: Medium
- **Description**: FAQ items only available in Vietnamese
- **Impact**: English-speaking users cannot read FAQ
- **Resolution**: Add English translations to i18n

### Issue 4: Hardcoded Content
- **Severity**: High
- **Description**: All FAQ content is hardcoded in component
- **Impact**: Admin cannot edit FAQ without code changes
- **Resolution**: Migrate to CMS

---

## Content Audit Checklist

- [x] Check FAQ questions - Found 3 hardcoded questions
- [x] Check FAQ answers - Found 3 hardcoded answers
- [x] Check FAQ count and order - 3 items in fixed order
- [x] Check FAQ expand/collapse behavior - Not implemented (static display)
- [x] Document findings in audit report - This report

---

## Next Steps

1. **Immediate**: Migrate FAQ items to CMS (Priority 1)
2. **Short-term**: Add English translations (Priority 1)
3. **Medium-term**: Implement expand/collapse behavior (Priority 2)
4. **Long-term**: Create dedicated FAQ page (Priority 2)

---

## Appendix: Code References

### FAQ Section Code Location
**File**: `d:\Loopy\loopy-frontend\src\pages\v2\V2LandingPage.tsx`
**Lines**: 165-180

### Related Files
- Footer component: `d:\Loopy\loopy-frontend\src\components\v2\V2Footer.tsx`
- i18n translations: `d:\Loopy\loopy-frontend\src\i18n\locales\vi.json`
- Router: `d:\Loopy\loopy-frontend\src\routes\AppRouter.tsx`

### Database References
- Content items seed: `d:\Loopy\loopy-backend\database\scripts\SEED_CONTENT_ITEMS.sql`
- Migration: `d:\Loopy\loopy-backend\database\migrations\024-seed-content-items.sql`

---

## Audit Metadata

- **Audit Date**: 2024
- **Auditor**: Kiro Spec Task Execution Agent
- **Task ID**: 5
- **Task Name**: Audit Landing Page FAQ Section
- **Spec Path**: `d:\Loopy\.kiro\specs\cms-content-audit\tasks.md`
- **Status**: ✅ Completed
- **Effort**: 1 hour
- **Findings**: 8 hardcoded content items, 0 CMS items, 0 editable items
- **Recommendations**: 4 priority levels with 8 action items
- **Issues**: 4 identified (1 high, 2 medium, 1 low severity)

