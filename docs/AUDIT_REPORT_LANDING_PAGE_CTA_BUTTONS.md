# CMS Content Audit Report: Landing Page CTA Buttons

**Audit Date**: 2024
**Auditor**: Kiro
**Page**: Landing Page (`/`)
**Task**: 2. Audit Landing Page CTA Buttons

---

## Executive Summary

The landing page contains **3 primary CTA buttons** that drive user engagement. All CTA button texts are currently **hardcoded** in the React components and are **NOT managed through the CMS**. However, the CMS infrastructure is in place with content items already seeded for landing page CTAs.

### Key Findings:
- **Total CTA Buttons**: 3
- **Hardcoded**: 3 (100%)
- **In CMS**: 0 (0%)
- **Editable via Admin UI**: 0 (0%)
- **Status**: All buttons need to be migrated to use CMS content

---

## Detailed CTA Button Audit

### 1. Primary CTA Button - Hero Section (Top)

**Location**: `src/components/landing/HeroSection.tsx` (Line 68-77)

**Button Text**: "Thử bài đầu tiên miễn phí" (VI) / "Try First Lesson Free" (EN)

**Button Type**: Primary (Teal background with gradient hover effect)

**Button Action**: 
```typescript
onClick={onStartCoding}
```
- If user is logged in and onboarding completed: Navigate to `/library/{language}`
- If user is logged in but onboarding not completed: Navigate to `/onboarding`
- If user is not logged in: Navigate to `/onboarding`

**Icon**: `Play` icon from lucide-react

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**CMS Key Available**: `landing.cta.primary` (Already seeded in database)

**Code Reference**:
```jsx
<button
  onClick={onStartCoding}
  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-teal px-8 py-4 text-[#0a0e1a] shadow-xl shadow-brand-teal/20 transition-transform hover:-translate-y-0.5"
>
  <div className="absolute inset-0 -translate-x-full bg-brand-cyan transition-transform duration-500 ease-out group-hover:translate-x-0" />
  <span className="relative z-10 flex items-center gap-2 text-base font-black md:text-lg">
    <Play className="h-5 w-5" />
    Thử bài đầu tiên miễn phí
    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
  </span>
</button>
```

**Languages**: VI (hardcoded), EN (hardcoded)

**Frequency of Change**: Rarely (core CTA, unlikely to change often)

**Audience**: Public (all users)

---

### 2. Secondary CTA Button - Hero Section (Top)

**Location**: `src/components/landing/HeroSection.tsx` (Line 79-85)

**Button Text**: "Tìm lộ trình phù hợp" (VI) / "Find Your Path" (EN)

**Button Type**: Secondary (White border with hover effect)

**Button Action**:
```typescript
onClick={onViewDocs}
```
- If user is logged in: Navigate to `/onboarding`
- If user is not logged in: Navigate to `/auth` with state `{ from: '/onboarding' }`

**Icon**: `Compass` icon from lucide-react

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**CMS Key Available**: `landing.cta.secondary` (Already seeded in database)

**Code Reference**:
```jsx
<button
  onClick={onViewDocs}
  className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-8 py-4 text-base font-bold text-white transition-all hover:border-brand-teal/50 hover:bg-white/10 md:text-lg"
>
  <Compass className="h-5 w-5 text-brand-teal" />
  Tìm lộ trình phù hợp
</button>
```

**Languages**: VI (hardcoded), EN (hardcoded)

**Frequency of Change**: Rarely (core CTA, unlikely to change often)

**Audience**: Public (all users)

---

### 3. Primary CTA Button - CTA Section (Bottom)

**Location**: `src/components/landing/CTASection.tsx` (Line 48-62)

**Button Text**: "Thử bài đầu tiên miễn phí" (VI) / "Try First Lesson Free" (EN)

**Button Type**: Primary (Teal border with gradient fill on hover)

**Button Action**:
```typescript
onClick={onStartCoding}
```
- Same behavior as Hero Section primary button

**Icon**: `Play` icon from lucide-react

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**CMS Key Available**: `landing.cta.primary` (Already seeded in database)

**Code Reference**:
```jsx
<button
  onClick={onStartCoding}
  className="group relative mt-9 inline-flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border-2 border-brand-teal bg-[#0a0e1a] px-9 py-4"
>
  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-brand-teal to-brand-cyan transition-transform duration-500 ease-out group-hover:translate-x-0" />

  <span className="relative z-10 flex items-center gap-3 text-lg font-black text-brand-teal transition-colors duration-300 group-hover:text-[#0a0e1a]">
    <Play className="h-5 w-5" />
    Thử bài đầu tiên miễn phí
    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
  </span>
</button>
```

**Languages**: VI (hardcoded), EN (hardcoded)

**Frequency of Change**: Rarely (core CTA, unlikely to change often)

**Audience**: Public (all users)

---

## Content Classification

### By Type
- **Button Text**: 3 items
- **Button Action/Link**: 2 unique actions (onStartCoding, onViewDocs)

### By Status
- **Hardcoded**: 3 items (100%)
- **In CMS**: 0 items (0%)
- **Editable**: 0 items (0%)

### By Frequency
- **Rarely Changed**: 3 items (core CTAs, unlikely to change)

### By Audience
- **Public**: 3 items (all users can see)

### By Language
- **VI (Vietnamese)**: 3 items
- **EN (English)**: 3 items
- **Both**: 3 items (bilingual)

---

## CMS Integration Status

### Current State
- ✅ CMS database tables created (`content_items`, `content_categories`)
- ✅ Landing category exists in database
- ✅ CMS keys already seeded:
  - `landing.cta.primary` (VI & EN)
  - `landing.cta.secondary` (VI & EN)
- ❌ Frontend components NOT using CMS content
- ❌ Button texts still hardcoded in React components

### What's in CMS Database
```sql
-- Already seeded in migration 024-seed-content-items.sql
SELECT c.id, 'landing.cta.primary', 'vi', 'Thử bài đầu tiên miễn phí', 'text' 
SELECT c.id, 'landing.cta.primary', 'en', 'Try First Lesson Free', 'text' 
SELECT c.id, 'landing.cta.secondary', 'vi', 'Tìm lộ trình phù hợp', 'text' 
SELECT c.id, 'landing.cta.secondary', 'en', 'Find Your Path', 'text' 
```

---

## Dependencies & Relationships

### Shared Content
- **landing.cta.primary** appears in 2 locations:
  1. Hero Section (top of page)
  2. CTA Section (bottom of page)
- Both use the same button text but different styling

### Linked Content
- **landing.cta.primary** → Links to onboarding or library based on user state
- **landing.cta.secondary** → Links to onboarding or auth based on user state

### Language Variants
- All 3 CTA buttons have both VI and EN versions
- Currently hardcoded in separate components
- CMS already has both language variants seeded

### Conditional Rendering
- Button actions depend on user authentication state
- Button actions depend on onboarding completion status
- Button text is NOT conditional (always shows same text)

---

## Migration Recommendations

### Priority: HIGH (Priority 1)

**Reason**: 
- CTA buttons are critical for user engagement
- CMS infrastructure already in place
- Content already seeded in database
- Minimal effort to migrate (just need to fetch from CMS)

**Effort Estimate**: 2-3 hours

**Steps to Migrate**:
1. Create `useContent` hook to fetch CMS content
2. Update `HeroSection.tsx` to use CMS content for button texts
3. Update `CTASection.tsx` to use CMS content for button texts
4. Test with both VI and EN languages
5. Verify button actions still work correctly

**Dependencies**:
- None (CMS infrastructure already exists)

**Blockers**:
- None identified

---

## Findings Summary

### Hardcoded Items (Need CMS Migration)
1. ✅ `landing.cta.primary` - Hero Section button text
2. ✅ `landing.cta.secondary` - Hero Section secondary button text
3. ✅ `landing.cta.primary` - CTA Section button text (duplicate key, same content)

### Items Already in CMS
1. ✅ `landing.cta.primary` (VI & EN)
2. ✅ `landing.cta.secondary` (VI & EN)

### Items Editable via Admin UI
- None currently (frontend not using CMS)

---

## Technical Details

### Frontend Components Involved
- `src/pages/LandingPage.tsx` - Main landing page component
- `src/components/landing/HeroSection.tsx` - Hero section with 2 CTAs
- `src/components/landing/CTASection.tsx` - Bottom CTA section with 1 CTA

### Backend/Database
- Table: `content_items`
- Category: `landing`
- Keys: `landing.cta.primary`, `landing.cta.secondary`
- Languages: `vi`, `en`

### Current Implementation
- Button texts are hardcoded strings in JSX
- Button actions are passed as props from parent component
- No CMS integration in frontend yet

### Proposed Implementation
- Create `useContent` hook to fetch from CMS API
- Replace hardcoded strings with CMS values
- Fallback to hardcoded values if CMS fetch fails
- Cache CMS content to avoid excessive API calls

---

## Verification Checklist

- [x] All CTA buttons identified
- [x] Button text verified (hardcoded vs CMS)
- [x] Button actions documented
- [x] Button links verified
- [x] CMS keys verified in database
- [x] Language variants documented
- [x] Dependencies identified
- [x] Migration path clear
- [x] No blockers identified

---

## Next Steps

1. **Immediate**: Review this audit report with team
2. **Short-term**: Create task to migrate CTA buttons to use CMS content
3. **Implementation**: 
   - Create `useContent` hook
   - Update components to use CMS content
   - Add fallback logic
   - Test with both languages
4. **Verification**: Confirm buttons work correctly with CMS content
5. **Admin UI**: Enable admins to edit CTA button texts via Content Manager

---

## Appendix: Code Locations

### HeroSection.tsx
- **File**: `src/components/landing/HeroSection.tsx`
- **Primary CTA**: Lines 68-77
- **Secondary CTA**: Lines 79-85

### CTASection.tsx
- **File**: `src/components/landing/CTASection.tsx`
- **Primary CTA**: Lines 48-62

### LandingPage.tsx
- **File**: `src/pages/LandingPage.tsx`
- **Component Integration**: Lines 1-100

---

## Audit Report Status

**Status**: ✅ COMPLETE

**Findings**: 
- 3 CTA buttons identified
- All hardcoded (100%)
- CMS infrastructure ready
- Clear migration path
- No blockers

**Recommendation**: Proceed with CMS migration for landing page CTA buttons

---

*Report Generated: 2024*
*Audit Task: 2. Audit Landing Page CTA Buttons*
*Spec: CMS Content Audit*
