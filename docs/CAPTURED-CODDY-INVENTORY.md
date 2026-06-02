# Captured Coddy Pages Inventory

Nguồn HTML local: `D:\Loopy\references\captured`

Mục tiêu: phân nhóm các file HTML đã capture để dùng khi dựng Loopy UI v2 sandbox. Đây là reference nội bộ, không copy nguyên asset/brand/copy vào sản phẩm chính.

## Public Marketing Pages
- `2026-05-26T18-12-40-757Z-coddy-tech.html`
  - URL: `https://coddy.tech/`
  - Template: homepage.
  - Dùng để tham khảo hero, mascot, language marquee/grid, product mock sections, final CTA.
- `2026-05-26T18-13-25-544Z-coddy-tech-landing.html`
  - URL: `https://coddy.tech/landing`
  - Template: all courses/catalog.
  - Dùng cho Public Languages/catalog của Loopy.
- `2026-05-26T18-13-52-091Z-coddy-tech-landing-javascript.html`
  - URL: `https://coddy.tech/landing/javascript`
  - Template: language landing/detail.
  - Dùng cho Public Language Detail/Syllabus-first page.
- `2026-05-26T18-14-43-748Z-coddy-tech-about.html`
  - URL: `https://coddy.tech/about`
  - Template: about/mission.
  - Dùng cho Loopy manifesto/about section nếu cần.
- `2026-05-26T18-14-54-818Z-coddy-tech-contact.html`
  - URL: `https://coddy.tech/contact`
  - Template: contact/support.
- `2026-05-26T18-15-06-463Z-coddy-tech-certifications.html`
  - URL: `https://coddy.tech/certifications`
  - Template: certification/outcome page.
  - Không copy claims nếu Loopy chưa có certificate thật.
- `2026-05-26T18-15-15-852Z-coddy-tech-affiliate.html`
  - URL: `https://coddy.tech/affiliate`
  - Template: affiliate/marketing conversion page.
- `2026-05-26T18-15-25-055Z-coddy-tech-teams.html`
  - URL: `https://coddy.tech/teams`
  - Template: teams/pricing.
  - Không ưu tiên cho Loopy hiện tại nếu chưa B2B.

## Public Utility / Content Pages
- `2026-05-26T18-14-05-398Z-coddy-tech-blog.html`
  - URL: `https://coddy.tech/blog`
  - Template: blog index.
  - Dùng nếu Loopy muốn thêm content hub sau.
- `2026-05-26T18-14-13-900Z-coddy-tech-docs.html`
  - URL: `https://coddy.tech/docs`
  - Template: docs index.
  - Dùng cho Docs landing.
- `2026-05-26T18-15-39-107Z-coddy-tech-docs-javascript.html`
  - URL: `https://coddy.tech/docs/javascript`
  - Template: docs language/concept navigation.
  - Dùng cho docs article layout: left nav + content + TOC.
- `2026-05-26T18-14-33-570Z-coddy-tech-tools.html`
  - URL: `https://coddy.tech/tools`
  - Template: tools index grouped by category.
- `2026-05-26T18-14-21-665Z-coddy-tech-playground-python.html`
  - URL: `https://coddy.tech/playground/python`
  - Template: public playground.
  - Dùng cho Loopy Playground v2: language list, editor, stdin, output, docs/body below.

## Onboarding
- `2026-05-26T18-15-59-131Z-coddy-tech-onboard-lang-javascript.html`
  - URL: `https://coddy.tech/onboard?lang=JavaScript`
  - Template: onboarding first step.
  - Dùng cho Loopy onboarding conversational/mascot style.

## Logged-In App / Learning Product Pages
- `2026-05-26T18-17-05-211Z-coddy-tech-journeys-javascript-fundamentals.html`
  - URL: `https://coddy.tech/journeys/javascript/fundamentals`
  - Template: journey/lesson map section.
  - Dùng mạnh cho Loopy Library/Journey Map v2.
- `2026-05-26T18-18-17-974Z-coddy-tech-journeys-javascript-sections-courses.html`
  - URL: `https://coddy.tech/journeys/javascript/sections#courses`
  - Template: journey sections/courses.
  - Dùng cho course/section navigation.
- `2026-05-26T18-17-12-880Z-coddy-tech-practice.html`
  - URL: `https://coddy.tech/practice`
  - Template: practice hub.
  - Dùng nếu Loopy tách practice riêng khỏi Learn.
- `2026-05-26T18-17-21-836Z-coddy-tech-projects.html`
  - URL: `https://coddy.tech/projects`
  - Template: projects hub.
- `2026-05-26T18-17-28-595Z-coddy-tech-goals.html`
  - URL: `https://coddy.tech/goals`
  - Template: goals/daily challenges.
  - Dùng cho streak/goals UX nếu làm sau.
- `2026-05-26T18-17-37-083Z-coddy-tech-leaderboard.html`
  - URL: `https://coddy.tech/leaderboard`
  - Template: leaderboard.
  - Dùng cho PvP/leaderboard style nếu cần.
- `2026-05-26T18-17-43-618Z-coddy-tech-store.html`
  - URL: `https://coddy.tech/store`
  - Template: store/rewards.
  - Không ưu tiên nếu Loopy chưa có economy/reward.
- `2026-05-26T18-17-51-163Z-coddy-tech-profile.html`
  - URL: `https://coddy.tech/profile`
  - Template: profile/account.
  - Dùng cho Settings/Profile v2.
- `2026-05-26T18-18-00-348Z-coddy-tech-notifications.html`
  - URL: `https://coddy.tech/notifications`
  - Template: notifications center.
- `2026-05-26T18-18-07-794Z-coddy-tech-challenges.html`
  - URL: `https://coddy.tech/challenges`
  - Template: challenge list/hub.
  - Dùng nếu Loopy muốn challenges riêng ngoài guided journey.

## Template Families
- Public shell:
  - Header + mega menu + language selector + CTA + footer.
  - Files: homepage, landing, language landing, docs, tools, blog, about, contact, cert, affiliate, teams.
- App shell:
  - Sidebar + top stats bar + dark/light theme handling + content panel.
  - Files: journeys, practice, projects, goals, leaderboard, store, profile, notifications, challenges.
- Learning journey:
  - Journey section/course map, current language, progress, lesson/challenge cards.
  - Files: `journeys-javascript-fundamentals`, `journeys-javascript-sections-courses`.
- Public content article/docs:
  - Left navigation, central content, table of contents, CTA to start/try.
  - Files: `docs-javascript`, docs index.
- Tool/playground:
  - Interactive tool/editor at top, educational body below.
  - Files: `tools`, `playground-python`.

## Recommended Loopy V2 Routes
- `/v2/landing`
  - Based on homepage capture and Coddy research, but with Loopy branding/copy.
- `/v2/languages`
  - Based on all courses/catalog capture.
- `/v2/languages/:language`
  - Based on language landing capture.
- `/v2/library`
  - Based on app shell + journey capture.
- `/v2/learn`
  - Should combine Loopy current 5-step Learn flow with Coddy app-shell clarity; no direct Coddy lesson editor capture exists here.
- `/v2/playground`
  - Based on public playground capture.
- `/v2/docs`
  - Based on docs capture.
- `/v2/profile`
  - Based on profile capture if needed.

## First Implementation Recommendation
Start with V2 sandbox routes, not replacing production routes:

1. `/v2/landing`
2. `/v2/library`
3. `/v2/learn`
4. `/v2/languages/:language`
5. `/v2/playground`

Use captures only as visual/reference input. Rebuild with React/Tailwind and Loopy data/copy.
