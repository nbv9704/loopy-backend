# CMS Content Audit Report: Landing Page Features Section

**Audit Date**: 2024
**Auditor**: Kiro Spec Task Execution Agent
**Page**: Landing Page (`/`)
**Task**: 3. Audit Landing Page Features Section

---

## Executive Summary

The landing page features section contains **6 feature cards** organized in two columns: "Trước Loopy" (Before Loopy - 3 problem cards) and "Với Loopy" (With Loopy - 3 solution cards). All feature card content is currently **hardcoded** in the React component and is **NOT managed through the CMS**.

### Key Findings:
- **Total Feature Cards**: 6
- **Total Content Items**: 12 (6 titles + 6 descriptions)
- **Hardcoded**: 12 (100%)
- **In CMS**: 0 (0%)
- **Editable via Admin UI**: 0 (0%)
- **Status**: All feature cards need to be migrated to use CMS content
- **Section Title**: "Vấn đề thật của người mới" (hardcoded)
- **Section Subtitle**: "Loopy không bắt bạn tự mò đường." (hardcoded)

---

## Detailed Feature Card Audit

### Section Header Content

#### 1. Section Eyebrow/Label

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 48)

**Content**: "Vấn đề thật của người mới" (VI) / "Real Problems for Beginners" (EN)

**Type**: Text (Section Label/Eyebrow)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
<div className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-brand-teal">
  Vấn đề thật của người mới
</div>
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with key `landing.features.eyebrow`

---

#### 2. Section Main Title

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 49-51)

**Content**: "Loopy không bắt bạn tự mò đường." (VI) / "Loopy Doesn't Make You Figure It Out Alone." (EN)

**Type**: Text (Section Title)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
<h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
  Loopy không bắt bạn tự mò đường.
</h2>
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with key `landing.features.title`

---

#### 3. Section Description/Subtitle

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 52-55)

**Content**: "Hầu hết người mới không thiếu động lực. Họ thiếu một bước tiếp theo đủ nhỏ, đủ rõ và có phản hồi ngay khi sai." (VI)

**Type**: Text (Section Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
<p className="mt-5 text-lg leading-8 text-slate-400">
  Hầu hết người mới không thiếu động lực. Họ thiếu một bước tiếp theo đủ nhỏ, đủ rõ và có phản hồi ngay khi sai.
</p>
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with key `landing.features.description`

---

### "Trước Loopy" (Before Loopy) - Problem Cards

#### 4. Problem Card 1: "Không biết bắt đầu từ đâu"

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 37-38)

**Card Title**: "Không biết bắt đầu từ đâu" (VI) / "Don't Know Where to Start" (EN)

**Card Description**: "Quá nhiều khóa học, video và thuật ngữ khiến bạn bị ngợp." (VI) / "Too many courses, videos, and jargon overwhelm you." (EN)

**Card Icon**: `Map` icon from lucide-react

**Type**: Text (Feature Card Title + Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
{ icon: Map, title: 'Không biết bắt đầu từ đâu', desc: 'Quá nhiều khóa học, video và thuật ngữ khiến bạn bị ngợp.' }
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with keys:
- `landing.features.problem1.title`
- `landing.features.problem1.description`

---

#### 5. Problem Card 2: "Cài đặt rối ngay từ đầu"

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 39)

**Card Title**: "Cài đặt rối ngay từ đầu" (VI) / "Setup is Messy from the Start" (EN)

**Card Description**: "Mất động lực trước khi viết được dòng code đầu tiên." (VI) / "You lose motivation before writing your first line of code." (EN)

**Card Icon**: `Wrench` icon from lucide-react

**Type**: Text (Feature Card Title + Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
{ icon: Wrench, title: 'Cài đặt rối ngay từ đầu', desc: 'Mất động lực trước khi viết được dòng code đầu tiên.' }
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with keys:
- `landing.features.problem2.title`
- `landing.features.problem2.description`

---

#### 6. Problem Card 3: "Gặp lỗi nhưng không hiểu lỗi"

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 40)

**Card Title**: "Gặp lỗi nhưng không hiểu lỗi" (VI) / "Errors Confuse You" (EN)

**Card Description**: "Một thông báo đỏ có thể làm người mới bỏ cuộc." (VI) / "A red error message can make beginners give up." (EN)

**Card Icon**: `AlertTriangle` icon from lucide-react

**Type**: Text (Feature Card Title + Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
{ icon: AlertTriangle, title: 'Gặp lỗi nhưng không hiểu lỗi', desc: 'Một thông báo đỏ có thể làm người mới bỏ cuộc.' }
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with keys:
- `landing.features.problem3.title`
- `landing.features.problem3.description`

---

### "Với Loopy" (With Loopy) - Solution Cards

#### 7. Solution Card 1: "Lộ trình theo mục tiêu"

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 44-45)

**Card Title**: "Lộ trình theo mục tiêu" (VI) / "Goal-Based Roadmap" (EN)

**Card Description**: "Loopy gợi ý bước tiếp theo dựa trên mục tiêu học của bạn." (VI) / "Loopy suggests the next step based on your learning goal." (EN)

**Card Icon**: `Puzzle` icon from lucide-react

**Type**: Text (Feature Card Title + Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
{ icon: Puzzle, title: 'Lộ trình theo mục tiêu', desc: 'Loopy gợi ý bước tiếp theo dựa trên mục tiêu học của bạn.' }
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with keys:
- `landing.features.solution1.title`
- `landing.features.solution1.description`

---

#### 8. Solution Card 2: "Code ngay trong trình duyệt"

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 46)

**Card Title**: "Code ngay trong trình duyệt" (VI) / "Code Right in Your Browser" (EN)

**Card Description**: "Bài học, editor và output nằm cùng một nơi." (VI) / "Lessons, editor, and output all in one place." (EN)

**Card Icon**: `MonitorPlay` icon from lucide-react

**Type**: Text (Feature Card Title + Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
{ icon: MonitorPlay, title: 'Code ngay trong trình duyệt', desc: 'Bài học, editor và output nằm cùng một nơi.' }
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with keys:
- `landing.features.solution2.title`
- `landing.features.solution2.description`

---

#### 9. Solution Card 3: "Phản hồi dễ hiểu"

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 47)

**Card Title**: "Phản hồi dễ hiểu" (VI) / "Clear Feedback" (EN)

**Card Description**: "Bạn biết vì sao sai và nên thử sửa theo hướng nào." (VI) / "You know why you're wrong and how to fix it." (EN)

**Card Icon**: `CheckCircle2` icon from lucide-react

**Type**: Text (Feature Card Title + Description)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
{ icon: CheckCircle2, title: 'Phản hồi dễ hiểu', desc: 'Bạn biết vì sao sai và nên thử sửa theo hướng nào.' }
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Rarely

**Audience**: Public

**Recommendation**: Add to CMS with keys:
- `landing.features.solution3.title`
- `landing.features.solution3.description`

---

### Column Headers

#### 10. "Trước Loopy" Column Header

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 60)

**Content**: "Trước Loopy" (VI) / "Before Loopy" (EN)

**Type**: Text (Column Header/Label)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
<div className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-red-200/80">
  Trước Loopy
</div>
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Never (structural)

**Audience**: Public

**Recommendation**: Add to CMS with key `landing.features.beforeLoopy` (optional, structural)

---

#### 11. "Với Loopy" Column Header

**Location**: `src/components/landing/FeaturesSection.tsx` (Line 75)

**Content**: "Với Loopy" (VI) / "With Loopy" (EN)

**Type**: Text (Column Header/Label)

**Status**: 
- **Hardcoded**: ✅ YES
- **In CMS**: ❌ NO
- **Editable**: ❌ NO

**Code Reference**:
```jsx
<div className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">
  Với Loopy
</div>
```

**Languages**: VI (hardcoded), EN (not available)

**Frequency of Change**: Never (structural)

**Audience**: Public

**Recommendation**: Add to CMS with key `landing.features.withLoopy` (optional, structural)

---

## Content Classification

### By Type
| Type | Count | Status |
|------|-------|--------|
| Text (Section Label) | 1 | Hardcoded |
| Text (Section Title) | 1 | Hardcoded |
| Text (Section Description) | 1 | Hardcoded |
| Text (Feature Card Title) | 6 | Hardcoded |
| Text (Feature Card Description) | 6 | Hardcoded |
| Text (Column Header) | 2 | Hardcoded |
| **Total** | **17** | **100% Hardcoded** |

### By Status
| Status | Count | Percentage |
|--------|-------|-----------|
| Hardcoded | 17 | 100% |
| In CMS | 0 | 0% |
| Editable via Admin UI | 0 | 0% |

### By Frequency
| Frequency | Count | Items |
|-----------|-------|-------|
| Rarely | 15 | Section title, subtitle, all feature cards |
| Never | 2 | Column headers (structural) |
| Frequently | 0 | None |

### By Audience
| Audience | Count |
|----------|-------|
| Public | 17 |
| Admin | 0 |
| User | 0 |

### By Language
| Language | Count |
|----------|-------|
| VI (Vietnamese) | 17 |
| EN (English) | 0 |
| Bilingual | 0 |

---

## Feature Card Count and Order

### Current Structure
The features section is organized in a **2-column grid layout**:

**Left Column: "Trước Loopy" (Before Loopy)**
1. Problem 1: "Không biết bắt đầu từ đâu" (Map icon)
2. Problem 2: "Cài đặt rối ngay từ đầu" (Wrench icon)
3. Problem 3: "Gặp lỗi nhưng không hiểu lỗi" (AlertTriangle icon)

**Right Column: "Với Loopy" (With Loopy)**
1. Solution 1: "Lộ trình theo mục tiêu" (Puzzle icon)
2. Solution 2: "Code ngay trong trình duyệt" (MonitorPlay icon)
3. Solution 3: "Phản hồi dễ hiểu" (CheckCircle2 icon)

### Feature Count
- **Total Feature Cards**: 6
- **Problem Cards**: 3
- **Solution Cards**: 3
- **Balanced**: Yes (equal number on both sides)

### Order
The order is **intentional and meaningful**:
- Problems are presented in a logical progression (confusion → setup → errors)
- Solutions directly address each problem in the same order
- Visual balance with 3 cards per column

---

## Icons and Visual Elements

### Icon Mapping

| Card | Icon | Icon Name | Color |
|------|------|-----------|-------|
| Problem 1 | 🗺️ | Map | Red (red-200) |
| Problem 2 | 🔧 | Wrench | Red (red-200) |
| Problem 3 | ⚠️ | AlertTriangle | Red (red-200) |
| Solution 1 | 🧩 | Puzzle | Teal (brand-teal) |
| Solution 2 | 📺 | MonitorPlay | Teal (brand-teal) |
| Solution 3 | ✅ | CheckCircle2 | Teal (brand-teal) |

### Icon Status
- **Hardcoded**: ✅ YES (imported from lucide-react)
- **In CMS**: ❌ NO (icons are code-based, not content)
- **Editable**: ❌ NO (would require code changes)

### Icon Recommendation
- Icons are **NOT suitable for CMS management** (they're code components, not content)
- Keep icons hardcoded in component
- Only manage icon selection through code changes

---

## Content Dependencies

### Shared Content
- None identified (features section content is unique to this section)

### Linked Content
- Feature cards are paired (problem ↔ solution)
- Order matters (problem 1 ↔ solution 1, etc.)
- Dependency: Solutions should maintain same order as problems

### Language Variants
- **VI**: All content has Vietnamese version (hardcoded)
- **EN**: No English version available (not hardcoded, not in CMS)

### Conditional Rendering
- None identified (all cards always visible)

---

## Issues & Discrepancies

### Issue 1: No English Language Support
**Severity**: MEDIUM

The features section only supports Vietnamese. No English translations are available in the component or CMS.

**Impact**: English users see Vietnamese text on features section.

**Recommendation**: 
- Add English translations for all feature cards
- Implement i18n support in component
- Add content to CMS with both VI and EN versions

---

### Issue 2: All Content Hardcoded
**Severity**: HIGH

All feature card content is hardcoded in the React component and not managed through CMS.

**Impact**: Admin cannot edit feature card text through CMS admin UI.

**Recommendation**:
- Create CMS entries for all feature cards
- Update component to fetch from CMS
- Implement fallback to hardcoded values if CMS fetch fails

---

### Issue 3: No CMS Integration
**Severity**: HIGH

The component does not use the `useContent` hook to fetch content from CMS.

**Impact**: Even if content is added to CMS, component won't use it.

**Recommendation**:
- Implement `useContent` hook in component
- Fetch all feature card content from CMS
- Add error handling and fallback logic

---

## Migration Recommendations

### Priority 1: HIGH IMPACT, LOW EFFORT

1. **Add Feature Cards to CMS**
   - Create CMS entries for all 6 feature cards
   - Add VI and EN translations
   - Keys:
     - `landing.features.problem1.title`, `landing.features.problem1.description`
     - `landing.features.problem2.title`, `landing.features.problem2.description`
     - `landing.features.problem3.title`, `landing.features.problem3.description`
     - `landing.features.solution1.title`, `landing.features.solution1.description`
     - `landing.features.solution2.title`, `landing.features.solution2.description`
     - `landing.features.solution3.title`, `landing.features.solution3.description`
   - Effort: 1 hour

2. **Add Section Header Content to CMS**
   - Create CMS entries for section title, subtitle, eyebrow
   - Add VI and EN translations
   - Keys:
     - `landing.features.eyebrow`
     - `landing.features.title`
     - `landing.features.description`
   - Effort: 30 minutes

### Priority 2: HIGH IMPACT, MEDIUM EFFORT

1. **Update FeaturesSection Component**
   - Integrate `useContent` hook
   - Fetch all feature card content from CMS
   - Fetch section header content from CMS
   - Implement fallback to hardcoded values
   - Effort: 2-3 hours

2. **Add i18n Support**
   - Implement language selector context
   - Update component to use i18n
   - Support both VI and EN
   - Effort: 2 hours

### Priority 3: MEDIUM IMPACT, LOW EFFORT

1. **Add Column Headers to CMS** (Optional)
   - Create CMS entries for column headers
   - Keys: `landing.features.beforeLoopy`, `landing.features.withLoopy`
   - Effort: 30 minutes
   - Note: These are structural labels, less critical

---

## Content That Cannot Be Managed via CMS

1. **Icons**: Code-based components from lucide-react, not suitable for CMS
2. **Component Layout**: HTML structure and styling, not suitable for CMS
3. **Card Styling**: CSS classes and animations, not suitable for CMS
4. **Grid Layout**: 2-column layout structure, not suitable for CMS

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Content Items Audited | 17 |
| Hardcoded Items | 17 (100%) |
| Items in CMS | 0 (0%) |
| Editable Items | 0 (0%) |
| Missing from CMS | 17 (100%) |
| Feature Cards | 6 |
| Problem Cards | 3 |
| Solution Cards | 3 |
| Language Coverage (VI) | 100% |
| Language Coverage (EN) | 0% |
| Estimated Effort to Complete | 5-6 hours |

---

## Comparison with Other Landing Page Sections

### vs. Hero Section
- **Hero**: 6 items hardcoded, 2 items in CMS (25% CMS coverage)
- **Features**: 17 items hardcoded, 0 items in CMS (0% CMS coverage)
- **Difference**: Features section has lower CMS coverage

### vs. CTA Buttons
- **CTA Buttons**: 3 items hardcoded, 0 items in CMS (0% CMS coverage)
- **Features**: 17 items hardcoded, 0 items in CMS (0% CMS coverage)
- **Similarity**: Both sections have no CMS integration yet

---

## Next Steps

1. **Review Audit Report** with team
2. **Prioritize Migration Items** based on impact and effort
3. **Create CMS Entries** for all feature cards
4. **Implement Component Integration** with CMS
5. **Add i18n Support** for English language
6. **Test** component with CMS values
7. **Verify** all content is properly managed

---

## Appendix: Code Reference

### FeaturesSection.tsx Structure

```jsx
// Section Header
<div className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-brand-teal">
  Vấn đề thật của người mới
</div>
<h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
  Loopy không bắt bạn tự mò đường.
</h2>
<p className="mt-5 text-lg leading-8 text-slate-400">
  Hầu hết người mới không thiếu động lực. Họ thiếu một bước tiếp theo đủ nhỏ, đủ rõ và có phản hồi ngay khi sai.
</p>

// Left Column: Problems
<div className="rounded-[2rem] border border-red-400/15 bg-red-500/[0.04] p-6 md:p-8">
  <div className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-red-200/80">
    Trước Loopy
  </div>
  {pains.map((item, index) => (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-200">
        <item.icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-bold text-white">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
      </div>
    </div>
  ))}
</div>

// Right Column: Solutions
<div className="rounded-[2rem] border border-brand-teal/25 bg-brand-teal/[0.06] p-6 md:p-8">
  <div className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">
    Với Loopy
  </div>
  {solutions.map((item, index) => (
    <div className="flex gap-4 rounded-2xl border border-brand-teal/20 bg-black/20 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
        <item.icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-bold text-white">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
      </div>
    </div>
  ))}
</div>
```

### Data Arrays

```jsx
const pains = [
  { icon: Map, title: 'Không biết bắt đầu từ đâu', desc: 'Quá nhiều khóa học, video và thuật ngữ khiến bạn bị ngợp.' },
  { icon: Wrench, title: 'Cài đặt rối ngay từ đầu', desc: 'Mất động lực trước khi viết được dòng code đầu tiên.' },
  { icon: AlertTriangle, title: 'Gặp lỗi nhưng không hiểu lỗi', desc: 'Một thông báo đỏ có thể làm người mới bỏ cuộc.' },
]

const solutions = [
  { icon: Puzzle, title: 'Lộ trình theo mục tiêu', desc: 'Loopy gợi ý bước tiếp theo dựa trên mục tiêu học của bạn.' },
  { icon: MonitorPlay, title: 'Code ngay trong trình duyệt', desc: 'Bài học, editor và output nằm cùng một nơi.' },
  { icon: CheckCircle2, title: 'Phản hồi dễ hiểu', desc: 'Bạn biết vì sao sai và nên thử sửa theo hướng nào.' },
]
```

---

## Audit Checklist

- [x] Feature card titles checked
- [x] Feature card descriptions checked
- [x] Feature card icons/labels checked
- [x] Feature count verified (6 cards)
- [x] Feature order verified (3 problems + 3 solutions)
- [x] Section header content checked
- [x] Column headers checked
- [x] Content dependencies analyzed
- [x] Language variants identified
- [x] Findings documented
- [x] Recommendations provided
- [x] Effort estimates provided

---

## Audit Report Status

**Status**: ✅ COMPLETE

**Findings**: 
- 6 feature cards identified (3 problems + 3 solutions)
- 17 total content items (titles + descriptions + headers)
- All hardcoded (100%)
- No CMS integration
- No English language support
- Clear migration path
- No blockers

**Recommendation**: Proceed with CMS migration for landing page features section

---

*Report Generated: 2024*
*Audit Task: 3. Audit Landing Page Features Section*
*Spec: CMS Content Audit*

