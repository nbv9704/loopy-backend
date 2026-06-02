# CMS Content Audit Report: Header Navigation

**Audit Date**: 2024
**Auditor**: Kiro Spec Task Execution Agent
**Spec**: cms-content-audit
**Task**: 7. Audit Header Navigation

---

## Executive Summary

The header navigation contains **11 content items** that need to be audited. Analysis reveals:

- **Total Content Items**: 11
- **Hardcoded Items**: 11 (100%)
- **Items in CMS**: 0 (0%)
- **Editable Items**: 0 (0%)
- **Status**: Not migrated to CMS
- **Recommendation**: HIGH PRIORITY - Migrate all navigation items to CMS

---

## Detailed Findings

### 1. Logo/Branding

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 40-47)

**Content**:
- **Logo Image**: `header-logo-w256.png`
- **Logo Alt Text**: "Loopy"
- **Logo Link Target**: `/` (home page)

**Type**: Image + Link
**Frequency**: Rarely changed
**Languages**: N/A
**Audience**: Public

**Details**:
```jsx
<Link to="/" className="flex items-center group">
  <img
    src={headerLogo}
    alt="Loopy"
    className="h-10 object-contain transition-transform duration-300 group-hover:scale-105"
  />
</Link>
```

**Status in CMS**: NOT IN CMS

**Branding Text**: "Loopy" (hardcoded in alt text)

**Recommendation**: 
- Logo image path can remain hardcoded (asset management)
- Logo alt text "Loopy" should be added to CMS with key `header.logo.alt`
- Logo link target `/` can remain hardcoded
- Priority: LOW (logo rarely changes)

---

### 2. Navigation Link: Learn

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 14-18)

**Content**:
- **i18n Key**: `nav.learn`
- **Vietnamese (VI)**: "Học tập"
- **English (EN)**: "Learn"
- **Link Target**: `/languages` (or `/library/{language}` if onboarding completed)
- **Link Order**: 1st in navigation

**Type**: Text (Navigation Link)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Public

**Details**:
```jsx
const NAV_ITEMS = [
  { id: 'learn', labelKey: 'nav.learn', path: '/languages' },
  // ...
]

// Rendered as:
<Link to={getItemPath(item)} className="...">
  {t(item.labelKey)}
</Link>
```

**i18n Values**:
- VI: "Học tập"
- EN: "Learn"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `nav.learn`
- Create VI and EN versions
- Update component to fetch from CMS instead of i18n
- Priority: HIGH

---

### 3. Navigation Link: Playground

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 14-18)

**Content**:
- **i18n Key**: `nav.playground`
- **Vietnamese (VI)**: "Playground"
- **English (EN)**: "Playground"
- **Link Target**: `/playground`
- **Link Order**: 2nd in navigation

**Type**: Text (Navigation Link)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Public

**Details**:
```jsx
{ id: 'playground', labelKey: 'nav.playground', path: '/playground' },
```

**i18n Values**:
- VI: "Playground"
- EN: "Playground"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `nav.playground`
- Create VI and EN versions
- Update component to fetch from CMS instead of i18n
- Priority: HIGH

---

### 4. Navigation Link: Challenges (PvP)

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 14-18)

**Content**:
- **i18n Key**: `nav.pvp`
- **Vietnamese (VI)**: "Thử thách"
- **English (EN)**: "Challenges"
- **Link Target**: `/pvp`
- **Link Order**: 3rd in navigation
- **Visibility**: Only shown if user is logged in

**Type**: Text (Navigation Link)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Public (authenticated users only)

**Details**:
```jsx
{ id: 'pvp', labelKey: 'nav.pvp', path: '/pvp' },

// Filtered to show only for authenticated users:
const visibleNavItems = NAV_ITEMS.filter(item => !(item.id === 'pvp' && !user))
```

**i18n Values**:
- VI: "Thử thách"
- EN: "Challenges"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `nav.pvp`
- Create VI and EN versions
- Document visibility rule: "Only shown for authenticated users"
- Update component to fetch from CMS instead of i18n
- Priority: HIGH

---

### 5. Navigation Link: Docs

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 14-18)

**Content**:
- **i18n Key**: `nav.docs`
- **Vietnamese (VI)**: "Tài liệu"
- **English (EN)**: "Docs"
- **Link Target**: `/docs`
- **Link Order**: 4th in navigation

**Type**: Text (Navigation Link)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Public

**Details**:
```jsx
{ id: 'docs', labelKey: 'nav.docs', path: '/docs' },
```

**i18n Values**:
- VI: "Tài liệu"
- EN: "Docs"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `nav.docs`
- Create VI and EN versions
- Update component to fetch from CMS instead of i18n
- Priority: HIGH

---

### 6. User Menu: Settings

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 130-135)

**Content**:
- **i18n Key**: `nav.settings`
- **Vietnamese (VI)**: "Cài đặt"
- **English (EN)**: "Settings"
- **Link Target**: `/settings`
- **Visibility**: Only shown if user is logged in

**Type**: Text (User Menu Item)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Authenticated users

**Details**:
```jsx
<Link to="/settings" onClick={() => setShowDropdown(false)} className="...">
  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
  {t('nav.settings')}
</Link>
```

**i18n Values**:
- VI: "Cài đặt"
- EN: "Settings"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `nav.settings`
- Create VI and EN versions
- Update component to fetch from CMS instead of i18n
- Priority: MEDIUM (user menu, less visible)

---

### 7. User Menu: Logout

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 137-142)

**Content**:
- **i18n Key**: `auth.logout`
- **Vietnamese (VI)**: "Đăng xuất"
- **English (EN)**: "Logout"
- **Action**: Sign out and navigate to home
- **Visibility**: Only shown if user is logged in

**Type**: Text (User Menu Item)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Authenticated users

**Details**:
```jsx
<button onClick={handleSignOut} className="...">
  <LogOut className="w-5 h-5" />
  {t('auth.logout')}
</button>
```

**i18n Values**:
- VI: "Đăng xuất"
- EN: "Logout"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `auth.logout`
- Create VI and EN versions
- Update component to fetch from CMS instead of i18n
- Priority: MEDIUM (user menu, less visible)

---

### 8. Login Button (Unauthenticated Users)

**Current Status**: HARDCODED (i18n key)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 144-152)

**Content**:
- **i18n Key**: `auth.login`
- **Vietnamese (VI)**: "Đăng nhập"
- **English (EN)**: "Login"
- **Link Target**: `/auth`
- **Visibility**: Only shown if user is NOT logged in

**Type**: Text (Button Label)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Public (unauthenticated users)

**Details**:
```jsx
<Link to="/auth" className="...">
  <User className="w-4 h-4 relative z-10" />
  <span className="relative z-10">{t('auth.login')}</span>
</Link>
```

**i18n Values**:
- VI: "Đăng nhập"
- EN: "Login"

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Add to CMS with key `auth.login`
- Create VI and EN versions
- Update component to fetch from CMS instead of i18n
- Priority: MEDIUM

---

### 9. Mobile Menu Toggle Button

**Current Status**: HARDCODED

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 154-161)

**Content**:
- **Aria Label**: "Mở menu" (Vietnamese)
- **Icon**: Menu/X icon (Lucide React)
- **Visibility**: Only shown on mobile (md:hidden)

**Type**: Text (Accessibility Label)
**Frequency**: Rarely changed
**Languages**: VI only
**Audience**: Mobile users

**Details**:
```jsx
<button
  type="button"
  onClick={() => setShowMobileMenu(value => !value)}
  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-brand-teal/40 hover:text-brand-teal md:hidden"
  aria-label="Mở menu"
  aria-expanded={showMobileMenu}
>
  {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
</button>
```

**Status in CMS**: NOT IN CMS

**Recommendation**:
- Add to CMS with key `header.mobileMenu.ariaLabel`
- Create VI and EN versions
- Priority: LOW (accessibility label, rarely changed)

---

### 10. Mobile Menu: Navigation Links

**Current Status**: HARDCODED (i18n keys)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 163-180)

**Content**:
- Same as desktop navigation links (Learn, Playground, Challenges, Docs)
- Rendered in mobile menu when toggled

**Type**: Text (Navigation Links)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Mobile users

**Details**:
```jsx
{showMobileMenu && (
  <div className="mt-4 rounded-2xl border border-white/10 bg-[#0a0e1a]/95 p-3 shadow-2xl md:hidden">
    <nav className="space-y-1">
      {visibleNavItems.map(item => (
        <Link key={item.id} to={getItemPath(item)} onClick={() => setShowMobileMenu(false)} className="...">
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
    {/* ... user menu items ... */}
  </div>
)}
```

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Same as desktop navigation links
- Mobile menu uses same i18n keys
- Priority: HIGH (same as desktop nav)

---

### 11. Mobile Menu: User Menu Items

**Current Status**: HARDCODED (i18n keys)

**Location**: `d:\Loopy\loopy-frontend\src\components\common\Header.tsx` (line 181-210)

**Content**:
- Settings link (same as desktop)
- Logout button (same as desktop)
- Login button (same as desktop)

**Type**: Text (User Menu Items)
**Frequency**: Rarely changed
**Languages**: VI, EN
**Audience**: Mobile users

**Details**:
```jsx
{user ? (
  <div className="mt-3 border-t border-white/10 pt-3">
    {/* User info and menu items */}
    <Link to="/settings" onClick={() => setShowMobileMenu(false)} className="...">
      <Settings className="h-4 w-4" />
      {t('nav.settings')}
    </Link>
    <button onClick={handleSignOut} className="...">
      <LogOut className="h-4 w-4" />
      {t('auth.logout')}
    </button>
  </div>
) : (
  <Link to="/auth" onClick={() => setShowMobileMenu(false)} className="...">
    <User className="h-4 w-4" />
    {t('auth.login')}
  </Link>
)}
```

**Status in CMS**: NOT IN CMS (using i18n JSON files)

**Recommendation**:
- Same as desktop user menu items
- Mobile menu uses same i18n keys
- Priority: MEDIUM (same as desktop user menu)

---

## Navigation Structure

### Desktop Navigation (md and above)
```
Header
├── Logo (Loopy)
├── Navigation Links (Desktop)
│   ├── Learn → /languages (or /library/{language})
│   ├── Playground → /playground
│   ├── Challenges → /pvp (authenticated only)
│   └── Docs → /docs
├── Language Switcher
├── Gamification Badges (authenticated only)
│   ├── Streak (Flame icon + count)
│   └── Points (Star icon + count)
├── User Avatar / Login Button
│   ├── If authenticated: Avatar dropdown
│   │   ├── User Info Header
│   │   ├── Settings → /settings
│   │   └── Logout
│   └── If not authenticated: Login button → /auth
└── Mobile Menu Toggle (hidden on desktop)
```

### Mobile Navigation (below md)
```
Header
├── Logo (Loopy)
├── Language Switcher
├── Mobile Menu Toggle
└── Mobile Menu (when toggled)
    ├── Navigation Links
    │   ├── Learn
    │   ├── Playground
    │   ├── Challenges (authenticated only)
    │   └── Docs
    ├── User Info (authenticated only)
    ├── Settings
    ├── Logout (authenticated only)
    └── Login (unauthenticated only)
```

---

## Navigation Link Order

### Current Order (Desktop)
1. Learn (Học tập / Learn)
2. Playground (Playground / Playground)
3. Challenges (Thử thách / Challenges) - authenticated only
4. Docs (Tài liệu / Docs)

### Current Order (Mobile)
Same as desktop

---

## Navigation Link Targets

| Link | Target | Condition |
|------|--------|-----------|
| Learn | `/languages` or `/library/{language}` | If onboarding completed, go to library; otherwise go to language selector |
| Playground | `/playground` | Always |
| Challenges | `/pvp` | Authenticated users only |
| Docs | `/docs` | Always |
| Settings | `/settings` | Authenticated users only |
| Logout | Sign out + navigate to `/` | Authenticated users only |
| Login | `/auth` | Unauthenticated users only |

---

## Content Classification

### By Type
| Type | Count | Status |
|------|-------|--------|
| Navigation Link | 4 | Hardcoded (i18n) |
| User Menu Item | 3 | Hardcoded (i18n) |
| Button Label | 1 | Hardcoded (i18n) |
| Accessibility Label | 1 | Hardcoded |
| Logo Alt Text | 1 | Hardcoded |
| **Total** | **10** | **All Hardcoded** |

### By Status
| Status | Count | Percentage |
|--------|-------|-----------|
| Hardcoded | 10 | 100% |
| In CMS | 0 | 0% |
| Editable via Admin UI | 0 | 0% |

### By Frequency
| Frequency | Count | Items |
|-----------|-------|-------|
| Rarely | 10 | All navigation items |
| Occasionally | 0 | None |
| Frequently | 0 | None |

### By Audience
| Audience | Count | Items |
|----------|-------|-------|
| Public | 6 | Learn, Playground, Docs, Login, Logo, Mobile Menu Toggle |
| Authenticated | 4 | Challenges, Settings, Logout, User Menu |

### By Language Support
| Language | Count | Items |
|----------|-------|-------|
| VI + EN | 7 | Learn, Playground, Challenges, Docs, Settings, Logout, Login |
| VI only | 1 | Mobile Menu Toggle aria-label |
| N/A | 2 | Logo, Logo Alt Text |

---

## Content Dependencies

### Shared Content
- **Navigation Links**: Same links appear in both desktop and mobile menus
- **User Menu Items**: Same items appear in both desktop and mobile menus
- **i18n Keys**: All text uses i18n keys from `en.json` and `vi.json`

### Language Variants
- **VI**: All navigation items have Vietnamese translations
  - Learn: "Học tập"
  - Playground: "Playground"
  - Challenges: "Thử thách"
  - Docs: "Tài liệu"
  - Settings: "Cài đặt"
  - Logout: "Đăng xuất"
  - Login: "Đăng nhập"

- **EN**: All navigation items have English translations
  - Learn: "Learn"
  - Playground: "Playground"
  - Challenges: "Challenges"
  - Docs: "Docs"
  - Settings: "Settings"
  - Logout: "Logout"
  - Login: "Login"

### Conditional Rendering
- **Challenges Link**: Only shown if user is authenticated
- **User Menu**: Only shown if user is authenticated
- **Login Button**: Only shown if user is NOT authenticated
- **Mobile Menu**: Only shown on mobile devices (below md breakpoint)

### Dynamic Routing
- **Learn Link**: Routes to `/languages` by default, but to `/library/{language}` if onboarding is completed
  - Uses `user.preferredLanguage` or `goalToLang[user.learningGoal]` to determine language
  - Fallback to `javascript` if no preference

---

## Issues & Discrepancies

### Issue 1: Navigation Items Not in CMS
**Severity**: HIGH

All navigation items are using i18n JSON files instead of CMS. This means:
- Admin cannot edit navigation text through CMS admin UI
- Changes require code deployment
- No audit trail for navigation changes

**Impact**: Navigation is not manageable through CMS.

**Recommendation**:
- Migrate all navigation items to CMS
- Create `useContent` hook to fetch navigation from CMS
- Update Header component to use hook
- Implement fallback to i18n if CMS fetch fails

---

### Issue 2: Mobile Menu Toggle Label Not Translated
**Severity**: LOW

Mobile menu toggle button has aria-label "Mở menu" (Vietnamese only). No English translation.

**Impact**: Accessibility label is not available in English.

**Recommendation**:
- Add English translation for aria-label
- Add to CMS with key `header.mobileMenu.ariaLabel`
- Create VI and EN versions

---

### Issue 3: Dynamic Learn Link Routing
**Severity**: MEDIUM

Learn link routes to different URLs based on user state:
- `/languages` if onboarding not completed
- `/library/{language}` if onboarding completed

This logic is hardcoded in component and not documented in CMS.

**Impact**: If admin wants to change Learn link target, they cannot do it through CMS.

**Recommendation**:
- Document this routing logic in CMS
- Consider making it configurable
- Add to CMS with key `nav.learn.target` and value `/languages` or `/library/{language}`

---

### Issue 4: Navigation Order Not Configurable
**Severity**: MEDIUM

Navigation link order is hardcoded in `NAV_ITEMS` array. Admin cannot reorder links through CMS.

**Impact**: If admin wants to change navigation order, they need to modify code.

**Recommendation**:
- Store navigation order in CMS
- Fetch and sort navigation items from CMS
- Allow admin to reorder through CMS admin UI

---

### Issue 5: Visibility Rules Not Documented
**Severity**: LOW

Some navigation items have visibility rules (e.g., Challenges only for authenticated users) that are hardcoded and not documented.

**Impact**: Admin may not understand why some items are hidden.

**Recommendation**:
- Document visibility rules in CMS
- Add `visibility` field to navigation items (public, authenticated, admin)
- Update component to respect visibility rules from CMS

---

## Migration Recommendations

### Priority 1: HIGH IMPACT, LOW EFFORT
1. **Add Navigation Links to CMS**
   - Create CMS entries for: Learn, Playground, Challenges, Docs
   - Add VI and EN translations
   - Effort: 1 hour

2. **Add User Menu Items to CMS**
   - Create CMS entries for: Settings, Logout, Login
   - Add VI and EN translations
   - Effort: 30 minutes

3. **Implement useContent Hook**
   - Create hook to fetch navigation from CMS
   - Add fallback to i18n
   - Effort: 2 hours

### Priority 2: HIGH IMPACT, MEDIUM EFFORT
1. **Update Header Component**
   - Integrate useContent hook
   - Fetch navigation items from CMS
   - Effort: 2 hours

2. **Add Navigation Order to CMS**
   - Store navigation order in CMS
   - Allow admin to reorder through CMS UI
   - Effort: 2 hours

3. **Document Visibility Rules**
   - Add visibility field to CMS navigation items
   - Update component to respect visibility rules
   - Effort: 1 hour

### Priority 3: MEDIUM IMPACT, LOW EFFORT
1. **Add Logo Alt Text to CMS**
   - Create CMS entry for logo alt text
   - Add VI and EN translations
   - Effort: 30 minutes

2. **Add Mobile Menu Toggle Label to CMS**
   - Create CMS entry for aria-label
   - Add VI and EN translations
   - Effort: 30 minutes

### Priority 4: LOW IMPACT, MEDIUM EFFORT
1. **Make Learn Link Target Configurable**
   - Store routing logic in CMS
   - Update component to use CMS configuration
   - Effort: 1 hour

---

## Content That Cannot Be Managed via CMS

1. **Navigation Icons**: Lucide React icons (Settings, LogOut, User, Menu, X) - not suitable for CMS
2. **Navigation Styling**: CSS classes and Tailwind styles - not suitable for CMS
3. **Navigation Logic**: onClick handlers, routing logic - not suitable for CMS
4. **Gamification Badges**: Streak and Points display - dynamic user data, not suitable for CMS

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Navigation Items Audited | 10 |
| Hardcoded Items | 10 (100%) |
| Items in CMS | 0 (0%) |
| Editable Items | 0 (0%) |
| Missing from CMS | 10 (100%) |
| Language Coverage (VI) | 100% |
| Language Coverage (EN) | 100% |
| Estimated Effort to Complete | 6-8 hours |

---

## Navigation Audit Checklist

- [x] Navigation link texts checked
- [x] Navigation link order documented
- [x] Navigation link targets documented
- [x] Logo/branding text checked
- [x] User menu items checked
- [x] Mobile menu items checked
- [x] Visibility rules documented
- [x] Language variants identified
- [x] Content dependencies analyzed
- [x] Issues identified
- [x] Recommendations provided
- [x] Effort estimates provided

---

## Next Steps

1. **Review Audit Report** with team
2. **Prioritize Migration Items** based on impact and effort
3. **Create Tasks** for each priority level
4. **Add Navigation Items to CMS** database
5. **Implement CMS Integration** in Header component
6. **Test** component with CMS values
7. **Verify** all navigation is properly managed

---

## Appendix: Current i18n Values

### Navigation Links
```json
{
  "nav": {
    "learn": "Learn",
    "playground": "Playground",
    "pvp": "Challenges",
    "docs": "Docs",
    "settings": "Settings"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  }
}
```

### Vietnamese Translations
```json
{
  "nav": {
    "learn": "Học tập",
    "playground": "Playground",
    "pvp": "Thử thách",
    "docs": "Tài liệu",
    "settings": "Cài đặt"
  },
  "auth": {
    "login": "Đăng nhập",
    "logout": "Đăng xuất"
  }
}
```

---

## Appendix: Header Component Structure

```
Header (fixed, top-0, z-50)
├── Gradient line (bottom border)
├── Container (max-w-[1800px], mx-auto)
│   ├── Left Section
│   │   ├── Logo Link
│   │   │   └── Logo Image (h-10)
│   │   └── Desktop Navigation (hidden md:flex)
│   │       ├── Learn Link
│   │       ├── Playground Link
│   │       ├── Challenges Link (authenticated only)
│   │       └── Docs Link
│   ├── Right Section
│   │   ├── Language Switcher
│   │   ├── Gamification Badges (authenticated only)
│   │   │   ├── Streak Badge
│   │   │   └── Points Badge
│   │   ├── User Avatar / Login Button
│   │   │   ├── Avatar Button (authenticated)
│   │   │   │   └── Dropdown Menu
│   │   │   │       ├── User Info Header
│   │   │   │       ├── Settings Link
│   │   │   │       └── Logout Button
│   │   │   └── Login Button (unauthenticated)
│   │   └── Mobile Menu Toggle (md:hidden)
│   └── Mobile Menu (md:hidden)
│       ├── Navigation Links
│       ├── User Info (authenticated only)
│       ├── Settings Link
│       ├── Logout Button (authenticated only)
│       └── Login Button (unauthenticated only)
```

---

**Report Status**: ✅ COMPLETE

**Reviewed By**: Kiro Spec Task Execution Agent

**Date**: 2024
