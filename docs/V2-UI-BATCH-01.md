# V2 UI Batch 01: Homepage, Catalog, Language Detail

Batch này đọc kỹ 3 capture Coddy quan trọng nhất để làm nền cho Loopy UI v2 sandbox. Chưa implement code trong batch này.

## Files Read
- `references/captured/2026-05-26T18-12-40-757Z-coddy-tech.html`
  - URL: `https://coddy.tech/`
  - Title: `Learn to Code Free Online - Python, JS & 15+ | Coddy.Tech`
  - Template: homepage.
- `references/captured/2026-05-26T18-13-25-544Z-coddy-tech-landing.html`
  - URL: `https://coddy.tech/landing`
  - Title: `Coddy - Free Interactive Coding Courses`
  - Template: catalog/all courses.
- `references/captured/2026-05-26T18-13-52-091Z-coddy-tech-landing-javascript.html`
  - URL: `https://coddy.tech/landing/javascript`
  - Title: `Learn JavaScript - Free Interactive Course | Coddy`
  - Template: language detail.

## Shared Public Shell
Ba trang dùng cùng public shell.

Structure chung:
- Sticky topbar.
- Logo.
- Navigation: `Languages`, `Playground`, `Tools`, `Resources`.
- Language selector.
- Primary CTA `GET STARTED`.
- Mobile/menu side navigation.
- Main content theo page type.
- Bottom CTA `Learn to code with Coddy`.
- Footer nhiều cột.

Class/component families thấy trong capture:
- `MainWrapper_container__fKleY`
- `Topbar_container__NWd8T`
- `Topbar_innerContainer__627Q_`
- `ContentSideNavigation_*`
- `DocsLanguageMenu_*`
- `ResourcesMenu_*`
- `BottomSection_*`
- `Toastify`
- `Text_*`
- `Link_link__o93CI`
- `ButtonBase_button__OiByR`
- `ButtonHome_container__sYaA6`

Design tokens/visual cues:
- Dark theme is active in captures: `data-theme-group="dark"`, `data-theme="dark"`, root background around `#252627`.
- Token names include `--brand-primary`, `--brand-primary-darker`, `--brand-bright`, `--bg-primary`, `--bg-card`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--border-color`, `--success`, `--error-darker`.
- Buttons have playful pressed depth with bottom shadow and active downward movement.
- Cards use rounded corners, hover border/translation/shadow.
- Layout max width appears around `1200px`, footer wider around `1440px`.
- Heavy use of icon/illustration assets for language identity and beginner-friendly feel.

Loopy adaptation:
- Build one public v2 shell shared by `/v2/landing`, `/v2/languages`, `/v2/languages/:language`.
- Keep navigation leaner than Coddy if Loopy has fewer stable pages.
- Use Loopy copy and assets/placeholders, not Coddy brand, mascot, exact CSS classes, or social proof.

## Homepage Capture
Purpose:
- Convert first-time visitor into starting the learning journey.
- Communicate product as free, fun, practical, habit-forming, and beginner-friendly.

Visual order:
- Hero with mascot and short headline.
- Primary CTA `GET STARTED`.
- Secondary CTA for existing account.
- Social proof/rating blocks.
- Repeating language icon bar.
- Catalog teaser.
- Product benefit sections:
  - Learn by Doing.
  - Build Your Coding Streak.
  - Code Anywhere, Anytime.
  - You're Not Alone in This.
  - Every way to learn.
  - Prove Your Skills.
- FAQ.
- Bottom CTA.
- Footer.

Key sections/classes:
- `LanguagesBar_*`: horizontal language chips/marquee.
- `Learn_*`: fake editor/testcase/console preview.
- `Gamification_*`: streak/calendar preview.
- `MobileApps_*`: mobile app mockup.
- `Community_*`: leaderboard/community preview.
- `TextSection_*`: repeated section text layout.
- `Certificates_*`: certificate mock.

What makes it work:
- It does not start with feature grid. It starts with a clear promise and one obvious action.
- Each section sells exactly one product behavior, with a concrete mock UI.
- The product previews are not generic dashboard cards; they show actual learning moments: editor, tests, streak, leaderboard, audio, quiz, certificate.
- Language variety appears visually through icons, not long explanations.

Loopy v2 homepage direction:
- Hero should say one simple Loopy promise for newbies, e.g. “Học lập trình bằng từng bước nhỏ, chạy code thật ngay trong trình duyệt.”
- Primary CTA should be sample/first lesson focused.
- Use mock Loopy Learn UI: mentor, editor, terminal, check result, journey node.
- Keep sections concrete:
  - Learn by changing code.
  - Run vs Check distinction.
  - Guided journey map.
  - Debug small mistakes.
  - Progress saved after completion.
- Do not use Coddy's learner count/rating/certificate claims.

## Catalog Capture
Purpose:
- Let user choose a programming language/course path.
- Support SEO and discovery without overwhelming the first action.

Visual order:
- Hero with eyebrow `Free interactive courses`.
- H1 `Learn to code with free interactive courses`.
- Description: pick language, write real code in browser, AI hints, free certificate.
- CTA `BROWSE LANGUAGES`.
- Small stats/chips like `22 languages`, `Free certificate`.
- `Browse all programming languages` grid.
- “Looking for something specific?” secondary block.
- `How it works` 3 steps.
- FAQ.
- Bottom CTA.
- Footer.

Key pattern:
- Catalog cards are single-purpose.
- Each card has icon, language name, one short description, arrow.
- The page does not try to teach language details in the catalog. It routes to language-specific pages.

Representative language grid items:
- HTML, JavaScript, Python, C++, C, SQL, C#, Java, Go, PHP, R, Dart, Rust, Lua, Ruby, Swift, Verilog, AI Prompts, Terminal, TypeScript, Git, CSS.

Loopy v2 catalog direction:
- `/v2/languages` should use simple cards: icon, language, “phù hợp với ai”, next action.
- Replace fake scale stats with real counts only if available from Loopy data.
- Add “Không biết bắt đầu từ đâu?” route to onboarding/recommendation.
- Use `How it works` adapted to Loopy:
  - Chọn lộ trình.
  - Làm bài đầu tiên với code thật.
  - Kiểm tra và lưu tiến độ.

## Language Detail Capture
Purpose:
- Convert user already interested in a specific language.
- Show enough syllabus depth to build trust.
- Provide clear choices: start, inspect syllabus, try playground.

Visual order:
- Hero with language-specific title, e.g. `Learn JavaScript`.
- Primary CTA `START LEARNING (it's free)`.
- Secondary CTAs: `View syllabus`, `Try in playground`.
- Feature chips/icons.
- `Syllabus` section.
- `Expand all` action.
- Accordion sections/chapters.
- Lesson rows with number, title, and tags.
- Related language courses.
- `Why learn JavaScript with Coddy`.
- Language-specific FAQ.
- Bottom CTA.
- Footer.

Syllabus patterns:
- Accordion structure is the core UI.
- Each section has metadata: lesson/challenge/question/project counts.
- Lesson rows use compact tags like `Challenge`, `Quiz`, `Audio`, `Mastery`, `Project`.
- Example macro sections include fundamentals, logic/flow, TypeScript, OOP.

Relevant classes:
- `LanguageHero_*`
- `Syllabus_*`
- `LandingCourseCard_*`
- `LandingFaq_*`
- `LandingBody_faq*`

Loopy v2 language detail direction:
- `/v2/languages/:language` should be syllabus-first, not marketing-first.
- Hero CTAs should be Loopy-specific:
  - `Bắt đầu bài đầu tiên`.
  - `Xem lộ trình`.
  - `Thử playground` only if it does not distract from guided learning.
- Use real Loopy chapter/lesson data where possible.
- Use lesson tags aligned with Loopy behavior:
  - `Quan sát`.
  - `Thực hành`.
  - `Kiểm tra`.
  - `Debug`.
  - `Project` only when real.
- Avoid certificate claims until Loopy has certificate product.

## CTA Pattern To Borrow
- One primary CTA per hero.
- Secondary CTAs are concrete and lower visual weight.
- Bottom CTA repeats the main action after content.
- Buttons feel tactile/playful through depth and rounded styling.

Loopy CTA vocabulary candidates:
- `Thử bài đầu tiên`.
- `Bắt đầu lộ trình`.
- `Xem Journey Map`.
- `Chạy lesson mẫu`.
- `Tìm lộ trình phù hợp`.

Avoid:
- `Get started` generic if Vietnamese UX is primary.
- Claims about scale/rating/certificate without data.

## Component Ideas For V2
- `V2PublicShell`
  - Shared topbar/footer for public v2 pages.
- `V2PressedButton`
  - Tactile button with bottom shadow.
- `V2LanguageCard`
  - Icon/title/description/action.
- `V2ProductMockLearn`
  - Loopy-specific mock of mentor/editor/terminal/check result.
- `V2JourneyPreview`
  - Small journey path with done/current/locked nodes.
- `V2SyllabusAccordion`
  - Section/chapter/lesson rows.
- `V2LessonTag`
  - Tags for Observe/Practice/Check/Debug/Project.

## Route Mapping
- Homepage capture -> `/v2/landing`.
- Catalog capture -> `/v2/languages`.
- Language detail capture -> `/v2/languages/:language`.

## Do Not Copy
- Coddy mascot Bit or SVG assets.
- Coddy logo, icons as-is, certificate design, app store/rating widgets.
- Coddy copywriting and social proof numbers.
- `Free certificate` claims if Loopy has no certificate.
- Coddy CSS module class names or exact visual implementation.
- Overly large mega menu if Loopy content is not ready.

## Implementation Guidance For Next Step
Build v2 sandbox, not replacement:
- Add route group under `/v2/*`.
- Start with `/v2/landing` and shared v2 shell.
- Use static mock data first.
- Do not wire to backend until visual direction is approved.
- Keep all existing production routes untouched.
