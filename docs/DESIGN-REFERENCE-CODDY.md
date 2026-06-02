# Design Reference: Coddy.tech UI Research

Nguồn tham khảo: `https://coddy.tech/`

Mục tiêu file này: ghi lại cách Coddy tổ chức UI/UX rất rõ ràng để tham khảo khi redesign Loopy. Không copy claim, số liệu, asset, mascot, certificate hoặc layout y nguyên. Chỉ dùng làm pattern tham khảo.

## Pages Researched
- Homepage: `https://coddy.tech/`
- All courses/catalog: `https://coddy.tech/landing`
- Language landing: `https://coddy.tech/landing/python`
- Onboarding entry: `https://coddy.tech/onboard`
- Auth: `https://coddy.tech/login?l=1`
- Playground: `https://coddy.tech/playground/python`
- Docs index: `https://coddy.tech/docs`
- Docs article: `https://coddy.tech/docs/javascript/arrays`
- Tools index: `https://coddy.tech/tools`
- Tool detail: `https://coddy.tech/tools/json-formatter`
- Blog index: `https://coddy.tech/blog`
- Blog article: `https://coddy.tech/blog/software-development/is-it-too-late-to-start-a-career-in-tech`
- Certifications: `https://coddy.tech/certifications`
- About: `https://coddy.tech/about`
- Teams: `https://coddy.tech/teams`
- FAQ: `https://coddy.tech/faqs`
- Sitemap groups inspected: `pages`, `landing`, `playground`, `tools`, `docs`, `blog`, `certifications`.

## Global UI Strategy
- Coddy tách mỗi trang thành một nhiệm vụ rõ: home để convert, landing để chọn course, language page để xem syllabus, playground để chạy code, docs để tra cứu, tools để dùng tiện ích, blog để đọc, cert page để chứng minh outcome.
- Header nhất quán trên toàn site: logo, `Languages`, `Playground`, `Tools`, `Resources`, language selector, CTA `GET STARTED`.
- Mega menu có hai action cho mỗi language: `Try in playground` và `Learn`. Đây là pattern rất rõ vì user biết ngay muốn thử code hay học có lộ trình.
- Footer rất lớn, lặp lại navigation theo nhóm: Company, Resources, Support, Languages, Playgrounds, Certifications, Tools, Documentation, Blog.
- Trang nào cũng có CTA cuối kiểu `Learn to code with Coddy` để gom traffic về onboarding.
- Copy ngắn, trực tiếp, ít jargon: mỗi section thường trả lời một câu hỏi cụ thể.

## Visual Language Observed
- Giao diện public thiên về light/clean, nhiều khoảng trắng, icon lớn, thẻ rõ ràng.
- Mascot/illustration tạo cảm giác vui và thân thiện cho người mới.
- Dùng nhiều icon ngôn ngữ để làm navigation trực quan thay vì chỉ text.
- Section được chia bằng heading rõ, card/grid, CTA ngắn.
- Gamification được minh họa bằng streak, score, energy, journey node, leaderboard.
- Mock UI rất cụ thể: editor, test cases, console, certificate, calendar, leaderboard, audio lesson.

## Homepage Pattern
- Hero rất ngắn: headline `The free, fun, and effective way to learn to code!`.
- Primary CTA: `GET STARTED`.
- Secondary CTA: login cho user cũ.
- Mascot đặt trong hero để tạo brand memory.
- Sau hero là language icon marquee/grid tạo cảm giác sản phẩm rộng nhưng vẫn dễ chọn.
- Homepage không cố giải thích mọi feature bằng text dài. Mỗi section bán một lợi ích:
  - Learn by Doing: editor/test cases/console.
  - Build Your Coding Streak: habit/calendar/reward.
  - Code Anywhere: mobile/web availability.
  - You're Not Alone: leaderboard/community.
  - Every way to learn: audio/quiz/AI/reference.
  - Prove Your Skills: certificate.
- Loopy nên học cách dùng mock product UI thay vì chỉ gradient/card abstract.

## Catalog / All Courses Pattern
- Hero: `Free interactive courses`, headline nói rõ chọn language và viết code ngay trong browser.
- Có stats ngắn phía hero, nhưng Loopy không được bịa stats nếu chưa có dữ liệu.
- Catalog là grid card language: icon, tên, mô tả một câu, arrow.
- Có section `How it works` 3 bước:
  - Pick a language.
  - Learn by writing real code.
  - Earn certificate.
- FAQ nằm cuối để xử lý objection.
- Loopy có thể dùng pattern 3 bước nhưng thay certificate bằng progress/journey nếu chưa có cert thật.

## Language Landing Pattern
- Đây là page rất đáng học cho Loopy Public Language Detail.
- Hero gồm badge `Popular/Journey`, title `Learn Python`, description rõ course học gì, CTA `START LEARNING`, link `View syllabus`, link `Try in playground`.
- Feature chips chạy ngang/lặp lại: beginner friendly, AI help, hands-on, audio, quiz, certificate.
- Syllabus là phần trung tâm, có section/chapter/lesson hierarchy rất rõ.
- Mỗi section có metadata: lessons, challenges, questions, projects.
- Course cards phụ nằm sau syllabus: courses liên quan của language.
- `Why learn X` và FAQ cuối trang xử lý lý do học.
- Loopy nên ưu tiên syllabus/journey rõ ràng hơn là marketing text dài.

## Onboarding/Auth Pattern
- `/onboard` public render rất tối giản: mascot/Bit nói `Hi there, I'm Bit!`, button `CONTINUE`.
- Auth page có headline `Unlock your Coding Journey`, tab `Log in/Register`, social login, email/password, benefit icons phía trên.
- Auth copy tập trung vào việc mở khóa journey, không nói kỹ thuật.
- Loopy nên giữ onboarding như hội thoại/guide ngắn, không form dày ngay từ đầu.

## Playground Pattern
- Playground là một product tool độc lập, không trộn vào lesson flow.
- Layout có language sidebar/list, title `Python Playground`, link `Read Docs`, mô tả một dòng.
- Editor có file tab `main.py`, actions `Reset`, `Erase`, `Run`.
- Có `Stdin` riêng, `Output` riêng.
- Bên dưới là SEO/education content: what it is, useful features, what can build, FAQ.
- Pattern quan trọng: playground là nơi experiment tự do; Learn là guided. Loopy đã đúng khi bỏ button Playground khỏi Learn để giảm nhiễu.

## Docs Pattern
- Docs index rất tối giản: title `Coddy Docs`, subtitle, 4 cards language/topic.
- Docs article có 3 cột logic:
  - Left: docs menu theo category.
  - Center: article content.
  - Right: table of contents.
- Article có breadcrumb, CTA `Try in Playground`, title cụ thể, short description, note `runnable editors`.
- Nội dung được chia thành sections nhỏ, mỗi concept kèm code runnable.
- Có inline promo card nhỏ với mascot `Master JavaScript the hands-on way`.
- Có previous/next navigation, FAQ, related concepts.
- Loopy docs nên học structure: nav rõ, TOC rõ, code example sát concept, CTA về lesson/playground đúng chỗ.

## Tools Pattern
- Tools index là grouped directory: Data, Text, Web, Security, Generators, Visual, Fun.
- Mỗi tool card có title + one-line utility statement.
- Tool detail gồm breadcrumb, category, title, short description, update date, live tool UI ngay trên đầu.
- Tool UI có action bar rõ: format/minify/indent/load sample/clear/copy.
- Sau live tool là educational content: what is, what you'll learn, step-by-step, quick reference, examples, mistakes, FAQ, related tools.
- Điểm hay: tool không chỉ là utility, mà là mini lesson.
- Loopy có thể áp dụng pattern này cho Playground hoặc Docs nếu muốn biến mỗi utility thành learning page.

## Blog Pattern
- Blog index dùng featured article lớn ở đầu với cover image, headline, summary, author/date/read time.
- Category chips: All, AI, Comparison, DSA, Software Development, Web Development.
- Post cards có image, category, title, excerpt, author/avatar/date/read time.
- Blog article có cover lớn, title, author block, TOC, breadcrumbs, article body, share buttons, author card, FAQ, related articles.
- Copy blog có voice mạnh, gần người mới, không formal quá.
- Loopy chưa cần blog UI nếu core Learn flow chưa xong.

## Certifications Pattern
- Page bán outcome rất rõ: `Certifications that prove you can actually code`.
- Hero có CTA, verify link, stats, certificate mockups.
- Browse grid theo language/topic.
- How it works 3 bước: pick journey, code through section, earn/share certificate.
- Có verify certificate form.
- Cảnh báo cho Loopy: không dùng certificate claim khi backend/product chưa có cert thật.

## About Pattern
- About rất ngắn, tập trung mission: `Elevating code learning to a daily hobby`.
- Vision cards: Practice-Driven, Unlimited Content, Fun, Personalized, AI Enhanced.
- Mỗi card có icon và paragraph ngắn.
- Loopy có thể dùng About như manifesto ngắn: newbie-first, guided, practice thật.

## Teams Pattern
- Teams page là pricing-style card, không liên quan trực tiếp Loopy hiện tại.
- Hero `Coddy for Teams`, pricing controls, seat count, monthly/yearly, benefits checklist, FAQ.
- Nếu Loopy chưa B2B, không ưu tiên.

## FAQ Pattern
- FAQ page chỉ có headline + long list Q/A, không cầu kỳ.
- Câu hỏi tập trung vào beginner objections: học ở đâu, bắt đầu sao, mất bao lâu, có khó không, học language nào, free không, có mobile không, có certificate không, AI assistant giúp gì.
- Loopy nên có FAQ tương tự trên landing/public pages để giảm mơ hồ cho người mới.

## What Makes Coddy Feel Clean
- Mỗi page có một primary job. Không nhét playground, docs, course, social, settings vào cùng một flow.
- CTA text ngắn và thống nhất.
- Page type nào cũng có template nhất quán: hero -> core interactive/content block -> explanation -> FAQ -> final CTA.
- Những khối phức tạp được đặt đúng nơi: syllabus ở language page, editor ở playground/lesson, TOC ở docs/blog, verify ở certifications.
- Cards không cố làm quá nhiều việc. Card thường chỉ có icon, title, one-line description, arrow/action.
- Dùng repeated footer/header để người dùng luôn có đường thoát.
- Public pages dùng SEO content dài bên dưới, nhưng phần interactive/action nằm trên đầu.

## Applying To Loopy
- Landing: nên chuyển từ “dark SaaS showcase” sang “guided coding journey app” với mascot/guide, mock Learn UI, journey map, CTA thử bài đầu tiên.
- Public Languages: dùng card grid sạch như Coddy catalog, mỗi card chỉ trả lời “học gì, dành cho ai, bắt đầu ở đâu”.
- Public Language Detail: đưa syllabus/journey lên làm trung tâm, có section/chapter/lesson counts thật nếu có data.
- Library: biến thành journey map rõ trạng thái done/active/locked, ít dashboard noise.
- Learn: giữ flow guided, không lẫn Playground. Tách rõ mentor, editor, terminal, check result, next action.
- Playground: giữ như sandbox độc lập với language switcher, stdin/output, docs/explanation dưới nếu là public page.
- Docs: nếu phát triển, dùng left nav + content + TOC, mỗi concept có code runnable hoặc link playground.
- Auth/Onboarding: dùng journey unlock language, không form-heavy.

## Things Not To Copy
- Không copy mascot Bit, assets, icon set, certificate design, exact wording dài, exact stats.
- Không dùng claims như enrolled count, app ratings, certificates issued nếu Loopy chưa có dữ liệu.
- Không copy pricing/team claims.
- Không copy SEO paragraphs y nguyên.

## Priority Redesign Order For Loopy
1. Landing hero + product mock: làm Loopy trông như learning app rõ ràng, không generic SaaS.
2. Library/Journey Map: làm rõ active/locked/done path.
3. Learn/LessonViewer: polish visual hierarchy, step actions, terminal/check result.
4. Public Language Detail: syllabus-first.
5. Playground: sandbox riêng, không chen vào guided lesson.
6. Docs/FAQ: hỗ trợ người mới và SEO sau khi core flow ổn.
