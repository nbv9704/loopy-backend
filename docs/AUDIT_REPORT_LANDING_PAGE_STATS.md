# CMS Content Audit Report: Landing Page Stats Section

**Audit Date**: 2024
**Auditor**: Kiro Spec Task Execution Agent
**Spec**: cms-content-audit
**Task**: 4. Audit Landing Page Stats Section

---

## Executive Summary

The landing page stats section contains **4 content items** that need to be audited. Analysis reveals:

- **Total Content Items**: 4
- **Hardcoded Items**: 4 (100%)
- **Items in CMS**: 0 (0%)
- **Editable Items**: 0 (0%)
- **Status**: NOT MIGRATED TO CMS
- **Component Status**: CREATED BUT NOT USED (StatsSection component exists but is not imported in LandingPage)
- **Recommendation**: HIGH PRIORITY - Migrate to CMS and integrate into landing page

---

## Detailed Findings

### 1. Stats Section Title

**Current Status**: HARDCODED (i18n key)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx` (line 32)
- i18n: `d:\Loopy\loopy-frontend\src\i18n\locales\vi.json` (line 404)

**Content**:
- **Vietnamese (VI)**: "Thống kê"
- **English (EN)**: "Impressive Numbers"

**Type**: Text (Section Title)
**Frequency**: Rarely changed
**Languages**: VI (i18n), EN (i18n)
**Audience**: Public

**Details**:
```jsx
<h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
  {t('landing.impressiveNumbers').split(' ')[0]}{' '}
  <span className="bg-gradient-to-r from-brand-teal to-brand-cyan bg-clip-text text-transparent">
    {t('landing.impressiveNumbers').split(' ').slice(1).join(' ')}
  </span>
</h2>
```

**i18n Entries**:
- Key: `landing.impressiveNumbers`
- VI Value: "Thống kê"
- EN Value: "Impressive Numbers"

**Status**: ✅ Using i18n (not hardcoded), but not in CMS

**Recommendation**: 
- Add to CMS with key `landing.stats.title`
- Create VI and EN versions
- Priority: MEDIUM

---

### 2. Stats Section Subtitle

**Current Status**: HARDCODED (i18n key)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx` (line 34)
- i18n: `d:\Loopy\loopy-frontend\src\i18n\locales\vi.json` (line 405)

**Content**:
- **Vietnamese (VI)**: "Cộng đồng học tập năng động và hỗ trợ lẫn nhau."
- **English (EN)**: "Student community growing strong every day"

**Type**: Text (Section Subtitle/Description)
**Frequency**: Rarely changed
**Languages**: VI (i18n), EN (i18n)
**Audience**: Public

**Details**:
```jsx
<p className="text-xl text-slate-400 max-w-2xl mx-auto">
  {t('landing.communityGrowing')}
</p>
```

**i18n Entries**:
- Key: `landing.communityGrowing`
- VI Value: "Cộng đồng học tập năng động và hỗ trợ lẫn nhau."
- EN Value: "Student community growing strong every day"

**Status**: ✅ Using i18n (not hardcoded), but not in CMS

**Recommendation**: 
- Add to CMS with key `landing.stats.subtitle`
- Create VI and EN versions
- Priority: MEDIUM

---

### 3. Stats Item 1: "Bắt đầu từ số 0"

**Current Status**: HARDCODED (in constants)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\constants\content.ts` (line 95)
- Component: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx` (line 60-70)

**Content**:
- **Label (VI)**: "Bắt đầu từ số 0"
- **Value**: "100%"
- **Icon**: "users"

**Type**: Text (Stat Label + Value)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public

**Details**:
```typescript
// In constants/content.ts
stats: [
  { id: 'zero-to-hero', label: 'Bắt đầu từ số 0', value: '100%', icon: 'users' },
  ...
]

// In component
<div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
<div className="text-xl text-slate-400">{stat.label}</div>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `landing.stats.item1.label`
- Create VI and EN versions
- Priority: HIGH

---

### 4. Stats Item 2: "Thực hành"

**Current Status**: HARDCODED (in constants)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\constants\content.ts` (line 96)
- Component: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx` (line 60-70)

**Content**:
- **Label (VI)**: "Thực hành"
- **Value**: "90%"
- **Icon**: "code"

**Type**: Text (Stat Label + Value)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public

**Details**:
```typescript
{ id: 'practice-rate', label: 'Thực hành', value: '90%', icon: 'code' },
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `landing.stats.item2.label`
- Create VI and EN versions
- Priority: HIGH

---

### 5. Stats Item 3: "Bài học Aha!"

**Current Status**: HARDCODED (in constants)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\constants\content.ts` (line 97)
- Component: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx` (line 60-70)

**Content**:
- **Label (VI)**: "Bài học Aha!"
- **Value**: "50+"
- **Icon**: "zap"

**Type**: Text (Stat Label + Value)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public

**Details**:
```typescript
{ id: 'aha-moment', label: 'Bài học Aha!', value: '50+', icon: 'zap' },
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `landing.stats.item3.label`
- Create VI and EN versions
- Priority: HIGH

---

### 6. Stats Item 4: "Hỗ trợ AI"

**Current Status**: HARDCODED (in constants)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\constants\content.ts` (line 98)
- Component: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx` (line 60-70)

**Content**:
- **Label (VI)**: "Hỗ trợ AI"
- **Value**: "24/7"
- **Icon**: "cpu"

**Type**: Text (Stat Label + Value)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public

**Details**:
```typescript
{ id: 'support', label: 'Hỗ trợ AI', value: '24/7', icon: 'cpu' },
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `landing.stats.item4.label`
- Create VI and EN versions
- Priority: HIGH

---

## Content Classification

### By Type
| Type | Count | Status |
|------|-------|--------|
| Text (Section Title) | 1 | i18n (not CMS) |
| Text (Section Subtitle) | 1 | i18n (not CMS) |
| Text (Stat Label) | 4 | Hardcoded |
| Text (Stat Value) | 4 | Hardcoded |
| Icon Reference | 4 | Hardcoded |
| **Total** | **14** | **All Hardcoded/i18n** |

### By Status
| Status | Count | Percentage |
|--------|-------|-----------|
| Hardcoded (constants) | 8 | 57% |
| i18n (not CMS) | 6 | 43% |
| In CMS | 0 | 0% |
| Editable via Admin UI | 0 | 0% |

### By Frequency
| Frequency | Count | Items |
|-----------|-------|-------|
| Rarely | 14 | All stats items |
| Occasionally | 0 | None |
| Frequently | 0 | None |

### By Audience
| Audience | Count |
|----------|-------|
| Public | 14 |
| Admin | 0 |
| User | 0 |

---

## Content Dependencies

### Shared Content
- **Stats Title**: "Thống kê" / "Impressive Numbers" - appears only in stats section
- **Stats Items**: Each stat item is unique to stats section

### Language Variants
- **VI**: All content has Vietnamese version (hardcoded in constants or i18n)
- **EN**: Section title and subtitle have English in i18n, but stat items (labels/values) only have VI

### Conditional Rendering
- None identified

---

## Critical Issues & Findings

### Issue 1: StatsSection Component Not Used in Landing Page
**Severity**: CRITICAL

The StatsSection component exists and is fully implemented, but it is NOT imported or used in the LandingPage component.

**Evidence**:
- Component file exists: `d:\Loopy\loopy-frontend\src\components\landing\StatsSection.tsx`
- Component is NOT imported in: `d:\Loopy\loopy-frontend\src\pages\LandingPage.tsx`
- No search results for `import.*StatsSection` in the codebase

**Impact**: 
- Stats section is not visible on the landing page
- All stats content is effectively unused
- Users cannot see the impressive statistics

**Recommendation**: 
- Import StatsSection in LandingPage
- Add to landing page layout (likely between HowItWorksSection and LanguagesSection)
- Add ref and animation props
- Priority: CRITICAL

---

### Issue 2: Stats Data Not in CMS
**Severity**: HIGH

All 4 stats items are hardcoded in constants and not in CMS database.

**Evidence**:
- Stats defined in: `d:\Loopy\loopy-frontend\src\constants\content.ts` (lines 95-98)
- No entries in `landing_stats` table (based on backend service code)
- Backend service expects data from `landing_stats` table but component uses hardcoded constants

**Impact**: 
- Admin cannot edit stats through CMS admin UI
- Stats values are static and require code changes to update
- Inconsistency between backend API and frontend implementation

**Recommendation**: 
- Migrate stats to CMS database
- Update component to fetch from API instead of constants
- Priority: HIGH

---

### Issue 3: Stat Values Are Metrics, Not Editable Content
**Severity**: MEDIUM

The stat values (100%, 90%, 50+, 24/7) appear to be metrics/claims rather than editable content.

**Evidence**:
- "100%" - Claim about starting from zero
- "90%" - Claim about practice rate
- "50+" - Claim about "Aha!" lessons
- "24/7" - Claim about AI support availability

**Questions**:
- Are these values accurate?
- How often should they be updated?
- Should they be dynamic (fetched from database)?
- Or are they aspirational/marketing claims?

**Recommendation**: 
- Clarify the purpose of each stat value
- Determine if values should be dynamic or static
- If dynamic, implement backend logic to calculate/update values
- If static, keep as CMS content
- Priority: MEDIUM

---

### Issue 4: Missing English Translations for Stat Items
**Severity**: MEDIUM

Stat item labels only have Vietnamese versions. No English translations available.

**Evidence**:
- Constants only define VI labels
- No `label_en` field in constants
- Backend service expects `label_en` field for multilingual support

**Impact**: 
- English users see Vietnamese stat labels
- Incomplete multilingual support

**Recommendation**: 
- Add English translations for all stat labels:
  - "Bắt đầu từ số 0" → "Start from Zero"
  - "Thực hành" → "Practice"
  - "Bài học Aha!" → "Aha! Lessons"
  - "Hỗ trợ AI" → "AI Support 24/7"
- Add to CMS with VI and EN versions
- Priority: MEDIUM

---

### Issue 5: Icon References Not Standardized
**Severity**: LOW

Icon references use different naming conventions.

**Evidence**:
- Constants use: 'users', 'code', 'zap', 'cpu'
- Backend migration script uses: 'Users', 'TrendingUp', 'Award'
- Component uses: `getIconComponent(stat.icon)` to map to actual icon

**Impact**: 
- Inconsistency in icon naming
- Potential for icon mapping errors

**Recommendation**: 
- Standardize icon naming convention
- Document icon mapping
- Priority: LOW

---

## Migration Recommendations

### Priority 1: CRITICAL
1. **Import and Use StatsSection in LandingPage**
   - Add import statement
   - Add component to JSX
   - Add ref and animation props
   - Effort: 30 minutes
   - Impact: Stats section becomes visible

### Priority 2: HIGH
1. **Migrate Stats to CMS Database**
   - Create CMS entries for 4 stat items
   - Add VI and EN translations
   - Effort: 1 hour
   - Impact: Admin can edit stats

2. **Update StatsSection Component**
   - Change from using constants to fetching from API
   - Implement error handling and fallback
   - Effort: 1 hour
   - Impact: Component uses CMS data

3. **Add English Translations**
   - Translate all stat labels to English
   - Add to CMS
   - Effort: 30 minutes
   - Impact: Multilingual support

### Priority 3: MEDIUM
1. **Clarify Stat Values**
   - Determine if values should be dynamic or static
   - Document the source/calculation for each value
   - Effort: 1 hour
   - Impact: Accurate metrics

2. **Standardize Icon Naming**
   - Document icon mapping
   - Ensure consistency across codebase
   - Effort: 30 minutes
   - Impact: Reduced errors

---

## Content That Cannot Be Managed via CMS

1. **Icon Components**: Icon rendering logic is component-based, not suitable for CMS
2. **Animation Props**: Framer Motion animation configuration, not suitable for CMS
3. **Grid Layout**: CSS grid layout (4 columns), not suitable for CMS

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Content Items Audited | 6 |
| Hardcoded Items | 8 (57%) |
| Items in i18n (not CMS) | 6 (43%) |
| Items in CMS | 0 (0%) |
| Editable Items | 0 (0%) |
| Language Coverage (VI) | 100% |
| Language Coverage (EN) | 33% (title/subtitle only) |
| Component Status | Created but NOT USED |
| Estimated Effort to Complete | 3-4 hours |

---

## Next Steps

1. **CRITICAL**: Import StatsSection in LandingPage and add to layout
2. **HIGH**: Migrate stats to CMS database
3. **HIGH**: Update component to fetch from API
4. **MEDIUM**: Add English translations
5. **MEDIUM**: Clarify stat values and sources
6. **LOW**: Standardize icon naming
7. **Test** component with CMS values
8. **Verify** stats section is visible and editable

---

## Appendix: Content Item Details

### Hardcoded Content Items (Constants)

```typescript
// d:\Loopy\loopy-frontend\src\constants\content.ts (lines 95-98)
stats: [
  { id: 'zero-to-hero', label: 'Bắt đầu từ số 0', value: '100%', icon: 'users' },
  { id: 'practice-rate', label: 'Thực hành', value: '90%', icon: 'code' },
  { id: 'aha-moment', label: 'Bài học Aha!', value: '50+', icon: 'zap' },
  { id: 'support', label: 'Hỗ trợ AI', value: '24/7', icon: 'cpu' },
]
```

### i18n Content Items

```json
// d:\Loopy\loopy-frontend\src\i18n\locales\vi.json
"landing": {
  "impressiveNumbers": "Thống kê",
  "communityGrowing": "Cộng đồng học tập năng động và hỗ trợ lẫn nhau."
}

// d:\Loopy\loopy-frontend\src\i18n\locales\en.json
"landing": {
  "impressiveNumbers": "Impressive Numbers",
  "communityGrowing": "Student community growing strong every day"
}
```

### Backend Migration Data

```typescript
// d:\Loopy\loopy-backend\src\scripts\migrate-content.ts (lines 758-761)
const LANDING_STATS = [
  { icon: 'Users', value: '1,000+', label: 'Học viên' },
  { icon: 'TrendingUp', value: '99+', label: 'Bài học' },
  { icon: 'Award', value: '100%', label: 'Miễn phí' },
]
```

**Note**: Backend migration data differs from frontend constants. This inconsistency needs to be resolved.

---

## Audit Checklist

- [x] Stats labels checked
- [x] Stats numbers/values checked
- [x] Stats descriptions checked
- [x] Stats icons checked
- [x] Component usage verified (NOT USED - CRITICAL ISSUE)
- [x] CMS status verified (NOT IN CMS)
- [x] i18n status verified (PARTIAL - title/subtitle only)
- [x] Content dependencies analyzed
- [x] Language variants identified
- [x] Findings documented
- [x] Recommendations provided
- [x] Effort estimates provided

---

**Report Status**: ✅ COMPLETE

**Reviewed By**: Kiro Spec Task Execution Agent

**Date**: 2024

**Critical Finding**: StatsSection component exists but is NOT imported in LandingPage. Stats section is not visible on the landing page.
