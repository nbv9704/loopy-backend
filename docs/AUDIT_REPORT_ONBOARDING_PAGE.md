# CMS Content Audit Report: Onboarding Page

**Audit Date**: 2024
**Auditor**: Kiro Spec Task Execution Agent
**Spec**: cms-content-audit
**Task**: 18. Audit Onboarding Page

---

## Executive Summary

The onboarding page contains **50+ content items** that need to be audited. Analysis reveals:

- **Total Content Items**: 50+
- **Hardcoded Items**: 48+ (96%)
- **Items in CMS**: 2 (4%)
- **Editable Items**: 2 (4%)
- **Status**: Minimal CMS coverage
- **Recommendation**: HIGH PRIORITY - Migrate all user-facing content to CMS

---

## Detailed Findings

### 1. Page Badge/Label

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 207-210)

**Content**:
- **Vietnamese (VI)**: "Journey Builder"
- **English (EN)**: "Journey Builder" (English text used)

**Type**: Text (Badge Label)
**Frequency**: Rarely changed
**Languages**: EN only (no VI translation)
**Audience**: Public (authenticated users)

**Details**:
```jsx
<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
  <Map className="h-4 w-4" />
  Journey Builder
</div>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.badge`
- Create VI translation: "Xây dựng lộ trình"
- Priority: MEDIUM

---

### 2. Step 1 Title

**Current Status**: HARDCODED + IN CMS (mismatch)

**Location**: 
- Frontend: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 223-225)
- CMS: `content_items` table with key `onboarding.title`

**Content**:
- **Vietnamese (VI)**: "Bạn muốn Loopy giúp bạn đạt điều gì trước?"
- **English (EN)**: Not in component

**Type**: Text (Heading)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
  Bạn muốn Loopy giúp bạn đạt điều gì trước?
</h1>
```

**CMS Entry**:
- Key: `onboarding.title`
- Category: `onboarding`
- VI Value: "Mục tiêu của bạn là gì?"
- EN Value: "What is your goal?"

**Issue**: The hardcoded title in component differs from CMS value. Component shows a more conversational question while CMS has a shorter version.

**Recommendation**: 
- Update CMS entry to match actual component text
- OR update component to use CMS value
- Add EN translation to component
- Priority: HIGH

---

### 3. Step 1 Subtitle

**Current Status**: HARDCODED + IN CMS (mismatch)

**Location**:
- Frontend: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 226)
- CMS: `content_items` table with key `onboarding.subtitle`

**Content**:
- **Vietnamese (VI)**: "Chọn mục tiêu gần nhất. Bạn có thể đổi sau."
- **English (EN)**: Not in component

**Type**: Text (Subtitle)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<p className="text-slate-400 text-lg">Chọn mục tiêu gần nhất. Bạn có thể đổi sau.</p>
```

**CMS Entry**:
- Key: `onboarding.subtitle`
- Category: `onboarding`
- VI Value: "Chọn một con đường phù hợp nhất với bạn lúc này"
- EN Value: "Choose the path that suits you best right now"

**Issue**: The hardcoded subtitle differs from CMS value.

**Recommendation**: 
- Update CMS or component to match
- Add EN translation to component
- Priority: HIGH

---

### 4. Goal Options (4 items)

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 10-33)

**Content**:
Four goal options with titles and descriptions:

1. **"Tôi chưa biết gì, muốn học lập trình từ đầu"**
   - Description: "Bắt đầu với những khái niệm cơ bản nhất qua ngôn ngữ Python dễ hiểu."
   - Icon: Compass
   - Color: cyan
   - Language: python

2. **"Tôi muốn học làm website"**
   - Description: "Làm quen với JavaScript - ngôn ngữ chính để tạo nên các trang web hiện đại."
   - Icon: Globe
   - Color: teal
   - Language: javascript

3. **"Tôi cần học để phục vụ việc trên trường"**
   - Description: "Nắm vững tư duy lập trình và cấu trúc dữ liệu với C++."
   - Icon: Cpu
   - Color: ocean
   - Language: cpp

4. **"Tôi chỉ muốn học thử xem mình có hợp không"**
   - Description: "Trải nghiệm nhanh các bài học thú vị để khám phá tiềm năng bản thân."
   - Icon: Play
   - Color: pink
   - Language: python

**Type**: Text (Goal Card Title + Description)
**Frequency**: Occasionally changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Status in CMS**: NOT IN CMS

**Recommendation**:
- Add to CMS with keys like:
  - `onboarding.goal.start_from_zero.title`
  - `onboarding.goal.start_from_zero.description`
  - `onboarding.goal.build_web.title`
  - `onboarding.goal.build_web.description`
  - `onboarding.goal.school_work.title`
  - `onboarding.goal.school_work.description`
  - `onboarding.goal.explore.title`
  - `onboarding.goal.explore.description`
- Create VI and EN versions
- Priority: HIGH

---

### 5. Step 2 Title

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 263-265)

**Content**:
- **Vietnamese (VI)**: "Bạn đang ở vạch xuất phát nào?"
- **English (EN)**: Not available

**Type**: Text (Heading)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
  Bạn đang ở vạch xuất phát nào?
</h1>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.step2.title`
- Create VI and EN versions
- Priority: HIGH

---

### 6. Step 2 Subtitle

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 266)

**Content**:
- **Vietnamese (VI)**: "Điều này giúp chúng mình chọn điểm bắt đầu phù hợp."
- **English (EN)**: Not available

**Type**: Text (Subtitle)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<p className="text-slate-400 text-lg">Điều này giúp chúng mình chọn điểm bắt đầu phù hợp.</p>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.step2.subtitle`
- Create VI and EN versions
- Priority: HIGH

---

### 7. Step 2 Back Button

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 258-261)

**Content**:
- **Vietnamese (VI)**: "Quay lại chọn mục tiêu"
- **English (EN)**: Not available

**Type**: Text (Button Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<button onClick={() => setStep(1)} className="...">
  <ArrowLeft className="h-4 w-4" /> Quay lại chọn mục tiêu
</button>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.step2.backButton`
- Create VI and EN versions
- Priority: MEDIUM

---

### 8. Experience Level Options (3 items)

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 44-48)

**Content**:
Three experience level options with titles and descriptions:

1. **"Tôi chưa bao giờ lập trình"**
   - Description: "Sẽ bắt đầu từ những thứ nhỏ nhất."
   - ID: never_coded

2. **"Tôi đã xem/đọc qua nhưng chưa tự làm được"**
   - Description: "Cần thực hành để hiểu rõ hơn."
   - ID: watched_some

3. **"Tôi đã biết một vài kiến thức cơ bản"**
   - Description: "Muốn hệ thống lại và nâng cao kỹ năng."
   - ID: know_basics

**Type**: Text (Experience Level Title + Description)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Status in CMS**: NOT IN CMS

**Recommendation**:
- Add to CMS with keys like:
  - `onboarding.experience.never_coded.title`
  - `onboarding.experience.never_coded.description`
  - `onboarding.experience.watched_some.title`
  - `onboarding.experience.watched_some.description`
  - `onboarding.experience.know_basics.title`
  - `onboarding.experience.know_basics.description`
- Create VI and EN versions
- Priority: HIGH

---

### 9. Step 3 Title

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 299-301)

**Content**:
- **Vietnamese (VI)**: "Đây là lộ trình khởi đầu của bạn."
- **English (EN)**: Not available

**Type**: Text (Heading)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
  Đây là lộ trình khởi đầu của bạn.
</h1>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.step3.title`
- Create VI and EN versions
- Priority: HIGH

---

### 10. Step 3 Subtitle

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 302)

**Content**:
- **Vietnamese (VI)**: "Nếu ổn, Loopy sẽ lưu lộ trình và đưa bạn tới bài đầu tiên."
- **English (EN)**: Not available

**Type**: Text (Subtitle)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<p className="text-lg text-slate-400">Nếu ổn, Loopy sẽ lưu lộ trình và đưa bạn tới bài đầu tiên.</p>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.step3.subtitle`
- Create VI and EN versions
- Priority: HIGH

---

### 11. Step 3 Back Button

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 294-297)

**Content**:
- **Vietnamese (VI)**: "Quay lại mức kinh nghiệm"
- **English (EN)**: Not available

**Type**: Text (Button Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<button onClick={() => setStep(2)} className="...">
  <ArrowLeft className="h-4 w-4" /> Quay lại mức kinh nghiệm
</button>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.step3.backButton`
- Create VI and EN versions
- Priority: MEDIUM

---

### 12. Summary Section Label

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 307)

**Content**:
- **Vietnamese (VI)**: "Bạn chọn"
- **English (EN)**: Not available

**Type**: Text (Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<div className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">Bạn chọn</div>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.summary.label`
- Create VI and EN versions
- Priority: MEDIUM

---

### 13. Summary Field Labels (2 items)

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 310, 314)

**Content**:
- **Vietnamese (VI)**: "Mục tiêu" and "Kinh nghiệm"
- **English (EN)**: Not available

**Type**: Text (Field Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<div className="text-sm text-slate-500">Mục tiêu</div>
// ...
<div className="text-sm text-slate-500">Kinh nghiệm</div>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with keys:
  - `onboarding.summary.goalLabel`
  - `onboarding.summary.experienceLabel`
- Create VI and EN versions
- Priority: MEDIUM

---

### 14. Path Preview Section Label

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 322-324)

**Content**:
- **Vietnamese (VI)**: "Lộ trình đề xuất"
- **English (EN)**: Not available

**Type**: Text (Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">
  <Rocket className="h-4 w-4" /> Lộ trình đề xuất
</div>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.pathPreview.label`
- Create VI and EN versions
- Priority: MEDIUM

---

### 15. Language Path Labels (3 sets)

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 50-68)

**Content**:
Three language paths with names, first lesson, and milestone:

**Python Foundations:**
- Name: "Python Foundations"
- First Lesson: "In dòng chữ đầu tiên"
- Milestone: "Hiểu biến, output và điều kiện cơ bản"

**JavaScript Web Starter:**
- Name: "JavaScript Web Starter"
- First Lesson: "Thay đổi nội dung trên trang"
- Milestone: "Tạo tương tác đầu tiên trong trình duyệt"

**C++ School Foundations:**
- Name: "C++ School Foundations"
- First Lesson: "Chạy chương trình C++ đầu tiên"
- Milestone: "Nắm input/output và tư duy giải bài"

**Type**: Text (Path Name + Description)
**Frequency**: Occasionally changed
**Languages**: Mixed (EN names, VI descriptions)
**Audience**: Public (authenticated users)

**Status in CMS**: NOT IN CMS

**Recommendation**:
- Add to CMS with keys like:
  - `onboarding.path.python.name`
  - `onboarding.path.python.firstLesson`
  - `onboarding.path.python.milestone`
  - `onboarding.path.javascript.name`
  - `onboarding.path.javascript.firstLesson`
  - `onboarding.path.javascript.milestone`
  - `onboarding.path.cpp.name`
  - `onboarding.path.cpp.firstLesson`
  - `onboarding.path.cpp.milestone`
- Create VI and EN versions
- Priority: HIGH

---

### 16. Path Preview Field Labels (3 items)

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 328-332)

**Content**:
- **Vietnamese (VI)**: "Bài đầu tiên", "Phiên đầu", "Cột mốc đầu"
- **English (EN)**: Not available

**Type**: Text (Field Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
{[
  { label: 'Bài đầu tiên', value: pathPreview.firstLesson },
  { label: 'Phiên đầu', value: 'Khoảng 5 phút' },
  { label: 'Cột mốc đầu', value: pathPreview.milestone },
].map(item => (...))}
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with keys:
  - `onboarding.pathPreview.firstLessonLabel`
  - `onboarding.pathPreview.sessionLabel`
  - `onboarding.pathPreview.milestoneLabel`
  - `onboarding.pathPreview.sessionValue` (for "Khoảng 5 phút")
- Create VI and EN versions
- Priority: MEDIUM

---

### 17. Primary CTA Button Text

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 346-349)

**Content**:
- **Vietnamese (VI)**: "Bắt đầu hành trình" (default) / "Đang tạo lộ trình..." (loading)
- **English (EN)**: Not available

**Type**: Text (Button Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
<button onClick={handleComplete} disabled={loading} className="...">
  {loading ? 'Đang tạo lộ trình...' : 'Bắt đầu hành trình'}
  {!loading && <CheckCircle2 className="h-5 w-5" />}
</button>
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with keys:
  - `onboarding.cta.start`
  - `onboarding.cta.loading`
- Create VI and EN versions
- Priority: HIGH

---

### 18. Error Message

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 177)

**Content**:
- **Vietnamese (VI)**: "Chưa lưu được lộ trình. Vui lòng thử lại để Loopy lưu đúng tiến độ của bạn."
- **English (EN)**: Not available

**Type**: Text (Error Message)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Public (authenticated users)

**Details**:
```jsx
setError('Chưa lưu được lộ trình. Vui lòng thử lại để Loopy lưu đúng tiến độ của bạn.')
```

**Status in CMS**: NOT IN CMS

**Recommendation**: 
- Add to CMS with key `onboarding.error.saveFailed`
- Create VI and EN versions
- Priority: MEDIUM

---

### 19. Progress Indicators

**Current Status**: HARDCODED (Visual only)

**Location**: `d:\Loopy\loopy-frontend\src\pages\OnboardingPage.tsx` (line 211-215)

**Content**:
- Visual progress bars (3 steps)
- No text labels

**Type**: Visual (Progress Bar)
**Frequency**: Rarely changed
**Languages**: N/A
**Audience**: Public (authenticated users)

**Details**:
```jsx
<div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
  {[1, 2, 3].map(item => (
    <div key={item} className={`h-2 rounded-full ${step >= item ? 'bg-brand-teal' : 'bg-white/10'}`} />
  ))}
</div>
```

**Status in CMS**: NOT IN CMS (and not suitable for CMS)

**Recommendation**: 
- Progress bars are visual elements, not text content
- Not suitable for CMS management
- Keep as hardcoded
- Priority: N/A

---

## Content Classification

### By Type
| Type | Count | Status |
|------|-------|--------|
| Text (Heading/Title) | 5 | Hardcoded (2 in CMS but mismatch) |
| Text (Subtitle) | 3 | Hardcoded (1 in CMS but mismatch) |
| Text (Button Label) | 4 | Hardcoded |
| Text (Badge/Label) | 6 | Hardcoded |
| Text (Goal Card) | 8 | Hardcoded |
| Text (Experience Level) | 6 | Hardcoded |
| Text (Path Info) | 9 | Hardcoded |
| Text (Field Label) | 5 | Hardcoded |
| Text (Error Message) | 1 | Hardcoded |
| Visual (Progress Bar) | 1 | Hardcoded |
| **Total** | **48+** | **96% Hardcoded** |

### By Status
| Status | Count | Percentage |
|--------|-------|-----------|
| Hardcoded | 48+ | 96% |
| In CMS | 2 | 4% |
| Editable via Admin UI | 2 | 4% |

### By Frequency
| Frequency | Count | Items |
|-----------|-------|-------|
| Rarely | 35 | Titles, subtitles, labels, buttons |
| Occasionally | 13 | Goal cards, experience levels, path info |
| Frequently | 0 | None identified |

### By Audience
| Audience | Count |
|----------|-------|
| Public (authenticated users) | 48+ |
| Admin | 0 |
| Guest | 0 |

---

## Content Dependencies

### Shared Content
- **Goal Options**: Unique to onboarding page
- **Experience Levels**: Unique to onboarding page
- **Path Labels**: May be shared with library page (Python Foundations, JavaScript Web Starter, C++ School Foundations)

### Language Variants
- **VI**: All content has Vietnamese version (hardcoded in component)
- **EN**: Only 2 items have English version in CMS:
  - `onboarding.title` (EN): "What is your goal?"
  - `onboarding.subtitle` (EN): "Choose the path that suits you best right now"
- **Mixed**: Some content uses English names with Vietnamese descriptions (language path names)

### Conditional Rendering
- **Step-based content**: Content changes based on current step (1, 2, or 3)
- **Loading state**: Button text changes when loading
- **Error state**: Error message appears when save fails
- **Selected state**: Summary shows selected goal and experience

---

## Issues & Discrepancies

### Issue 1: Mismatch between Hardcoded and CMS Content
**Severity**: HIGH

The hardcoded onboarding title in the component differs from the CMS value:
- **Hardcoded**: "Bạn muốn Loopy giúp bạn đạt điều gì trước?"
- **CMS (VI)**: "Mục tiêu của bạn là gì?"

**Impact**: If admin updates CMS, the change won't be reflected on the page because component uses hardcoded value.

**Recommendation**: 
- Decide which version is correct
- Update CMS or component to match
- Implement component to fetch from CMS

### Issue 2: Component Not Using CMS Values
**Severity**: HIGH

CMS has content items for onboarding page, but component is using hardcoded values instead of fetching from CMS.

**Impact**: Admin cannot edit onboarding content through CMS admin UI.

**Recommendation**:
- Create `useContent` hook to fetch content from CMS
- Update OnboardingPage component to use hook
- Implement fallback to hardcoded values if CMS fetch fails

### Issue 3: Missing English Translations
**Severity**: HIGH

Component only supports Vietnamese. CMS has minimal English translations and they're not used.

**Impact**: English users see Vietnamese text on onboarding page.

**Recommendation**:
- Implement i18n support in component
- Add all missing EN translations to CMS
- Use CMS values for both VI and EN

### Issue 4: Goal Cards Not in CMS
**Severity**: HIGH

Goal cards (4 items with titles and descriptions) are hardcoded and not in CMS.

**Impact**: Admin cannot edit goal card text, which is important for user onboarding experience.

**Recommendation**:
- Add goal cards to CMS
- Update component to fetch from CMS
- Priority: HIGH

### Issue 5: Experience Levels Not in CMS
**Severity**: HIGH

Experience level options (3 items) are hardcoded and not in CMS.

**Impact**: Admin cannot edit experience level text.

**Recommendation**:
- Add experience levels to CMS
- Update component to fetch from CMS
- Priority: HIGH

### Issue 6: Path Information Not in CMS
**Severity**: MEDIUM

Language path information (names, first lesson, milestone) is hardcoded.

**Impact**: Admin cannot edit path information, which may need updates as curriculum changes.

**Recommendation**:
- Add path information to CMS
- Update component to fetch from CMS
- Priority: MEDIUM

---

## Migration Recommendations

### Priority 1: HIGH IMPACT, LOW EFFORT

1. **Update Onboarding Title in CMS**
   - Align CMS value with actual component text
   - Add EN translation
   - Effort: 30 minutes

2. **Update Onboarding Subtitle in CMS**
   - Align CMS value with actual component text
   - Add EN translation
   - Effort: 30 minutes

3. **Add CTA Button Text to CMS**
   - Create CMS entries for "Bắt đầu hành trình" and "Đang tạo lộ trình..."
   - Add VI and EN translations
   - Effort: 30 minutes

4. **Add Error Message to CMS**
   - Create CMS entry for save failed error
   - Add VI and EN translations
   - Effort: 15 minutes

### Priority 2: HIGH IMPACT, MEDIUM EFFORT

1. **Add Goal Cards to CMS**
   - Create CMS entries for 4 goal cards (title + description each)
   - Add VI and EN translations
   - Effort: 2 hours

2. **Add Experience Levels to CMS**
   - Create CMS entries for 3 experience levels (title + description each)
   - Add VI and EN translations
   - Effort: 1 hour

3. **Implement useContent Hook**
   - Create hook to fetch content from CMS
   - Add fallback to hardcoded values
   - Effort: 2 hours

4. **Update OnboardingPage Component**
   - Integrate useContent hook
   - Fetch all content from CMS
   - Effort: 3 hours

### Priority 3: MEDIUM IMPACT, MEDIUM EFFORT

1. **Add Path Information to CMS**
   - Create CMS entries for 3 language paths (name, first lesson, milestone each)
   - Add VI and EN translations
   - Effort: 1.5 hours

2. **Add Step Titles and Subtitles to CMS**
   - Create CMS entries for step 2 and step 3 titles/subtitles
   - Add VI and EN translations
   - Effort: 1 hour

3. **Add Field Labels to CMS**
   - Create CMS entries for all field labels (summary, path preview)
   - Add VI and EN translations
   - Effort: 1 hour

### Priority 4: LOW IMPACT, LOW EFFORT

1. **Add Badge Text to CMS**
   - Create CMS entry for "Journey Builder" badge
   - Add VI translation
   - Effort: 15 minutes

2. **Add Back Button Text to CMS**
   - Create CMS entries for back buttons
   - Add VI and EN translations
   - Effort: 30 minutes

---

## Content That Cannot Be Managed via CMS

1. **Progress Indicators**: Visual elements (progress bars), not text content
2. **Component Layout**: HTML structure and styling, not suitable for CMS
3. **Button Actions**: onClick handlers and navigation logic, not suitable for CMS
4. **Icons**: Lucide React icons, not suitable for CMS
5. **Color Mappings**: CSS classes for goal card colors, not suitable for CMS
6. **Goal-to-Language Mapping**: Business logic mapping goal IDs to language IDs

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Content Items Audited | 50+ |
| Hardcoded Items | 48+ (96%) |
| Items in CMS | 2 (4%) |
| Editable Items | 2 (4%) |
| Missing from CMS | 48+ (96%) |
| Language Coverage (VI) | 100% |
| Language Coverage (EN) | 4% |
| Estimated Effort to Complete | 12-15 hours |

---

## Next Steps

1. **Review Audit Report** with team
2. **Prioritize Migration Items** based on impact and effort
3. **Create Tasks** for each priority level
4. **Implement CMS Integration** in OnboardingPage component
5. **Add Missing Content** to CMS database
6. **Test** component with CMS values
7. **Verify** all content is properly managed
8. **Add i18n Support** for English translations

---

## Appendix: Content Item Details

### CMS Content Items (Current)

```sql
-- Onboarding Page (Current in CMS)
onboarding.title (VI): "Mục tiêu của bạn là gì?"
onboarding.title (EN): "What is your goal?"

onboarding.subtitle (VI): "Chọn một con đường phù hợp nhất với bạn lúc này"
onboarding.subtitle (EN): "Choose the path that suits you best right now"
```

### Hardcoded Content Items (Component)

```jsx
// Badge
"Journey Builder"

// Step 1
"Bạn muốn Loopy giúp bạn đạt điều gì trước?"
"Chọn mục tiêu gần nhất. Bạn có thể đổi sau."

// Goal Cards
[
  {
    title: 'Tôi chưa biết gì, muốn học lập trình từ đầu',
    desc: 'Bắt đầu với những khái niệm cơ bản nhất qua ngôn ngữ Python dễ hiểu.'
  },
  {
    title: 'Tôi muốn học làm website',
    desc: 'Làm quen với JavaScript - ngôn ngữ chính để tạo nên các trang web hiện đại.'
  },
  {
    title: 'Tôi cần học để phục vụ việc trên trường',
    desc: 'Nắm vững tư duy lập trình và cấu trúc dữ liệu với C++.'
  },
  {
    title: 'Tôi chỉ muốn học thử xem mình có hợp không',
    desc: 'Trải nghiệm nhanh các bài học thú vị để khám phá tiềm năng bản thân.'
  }
]

// Step 2
"Bạn đang ở vạch xuất phát nào?"
"Điều này giúp chúng mình chọn điểm bắt đầu phù hợp."
"Quay lại chọn mục tiêu"

// Experience Levels
[
  {
    title: 'Tôi chưa bao giờ lập trình',
    desc: 'Sẽ bắt đầu từ những thứ nhỏ nhất.'
  },
  {
    title: 'Tôi đã xem/đọc qua nhưng chưa tự làm được',
    desc: 'Cần thực hành để hiểu rõ hơn.'
  },
  {
    title: 'Tôi đã biết một vài kiến thức cơ bản',
    desc: 'Muốn hệ thống lại và nâng cao kỹ năng.'
  }
]

// Step 3
"Đây là lộ trình khởi đầu của bạn."
"Nếu ổn, Loopy sẽ lưu lộ trình và đưa bạn tới bài đầu tiên."
"Quay lại mức kinh nghiệm"

// Summary Section
"Bạn chọn"
"Mục tiêu"
"Kinh nghiệm"

// Path Preview
"Lộ trình đề xuất"
"Bài đầu tiên"
"Phiên đầu"
"Cột mốc đầu"
"Khoảng 5 phút"

// Language Paths
{
  python: {
    name: 'Python Foundations',
    firstLesson: 'In dòng chữ đầu tiên',
    milestone: 'Hiểu biến, output và điều kiện cơ bản'
  },
  javascript: {
    name: 'JavaScript Web Starter',
    firstLesson: 'Thay đổi nội dung trên trang',
    milestone: 'Tạo tương tác đầu tiên trong trình duyệt'
  },
  cpp: {
    name: 'C++ School Foundations',
    firstLesson: 'Chạy chương trình C++ đầu tiên',
    milestone: 'Nắm input/output và tư duy giải bài'
  }
}

// CTA Button
"Bắt đầu hành trình"
"Đang tạo lộ trình..."

// Error Message
"Chưa lưu được lộ trình. Vui lòng thử lại để Loopy lưu đúng tiến độ của bạn."
```

---

## Audit Checklist

- [x] Step titles and descriptions checked
- [x] Form labels and placeholders checked (N/A - no form inputs)
- [x] CTA buttons checked
- [x] Validation messages checked
- [x] Progress indicators checked
- [x] Goal cards checked
- [x] Experience levels checked
- [x] Path information checked
- [x] Summary section checked
- [x] Content dependencies analyzed
- [x] Language variants identified
- [x] Findings documented
- [x] Recommendations provided
- [x] Effort estimates provided

---

**Report Status**: ✅ COMPLETE

**Reviewed By**: Kiro Spec Task Execution Agent

**Date**: 2024

