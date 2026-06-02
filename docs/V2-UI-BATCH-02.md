# V2 UI Batch 02: Playground, Tools, Docs

Batch này đọc các capture kế tiếp sau public/course/journey skeleton để làm nền cho `/v2/playground` và sau đó `/v2/docs`. Chưa copy asset, copywriting, class name hoặc claim của Coddy.

## Files Read
- `references/captured/2026-05-26T18-14-21-665Z-coddy-tech-playground-python.html`
  - URL: `https://coddy.tech/playground/python`
  - Title: `Python Playground - Python Compiler Online, Free | Coddy`
  - Template: public playground/compiler page.
- `references/captured/2026-05-26T18-14-33-570Z-coddy-tech-tools.html`
  - URL: `https://coddy.tech/tools`
  - Title: `Free Online Developer Tools | Coddy`
  - Template: developer tools index.
- `references/captured/2026-05-26T18-14-13-900Z-coddy-tech-docs.html`
  - URL: `https://coddy.tech/docs`
  - Title: `Programming Docs - Python, JS, Java & More | Coddy`
  - Template: docs index.
- `references/captured/2026-05-26T18-15-39-107Z-coddy-tech-docs-javascript.html`
  - URL: `https://coddy.tech/docs/javascript`
  - Title: `JavaScript Documentation - Coddy`
  - Template: docs language/article shell.

## Playground Capture
Purpose:
- Let users run code immediately in browser without signing up.
- Serve SEO/content visitors who need a compiler/playground, while still offering paths into guided learning.

Observed structure:
- Shared public shell.
- Top interactive editor block.
- Monaco/VS Code style editor at top.
- Language-specific page, e.g. `/playground/python`.
- Editor has a large code area and execution/output side or lower panel.
- Body below editor explains what the playground is for.
- Body sections seen in text:
  - `Run Python online in your browser`.
  - `What makes this Python playground useful`.
  - `What you can build in the Python playground`.
- Input/stdin is explicitly part of playground behavior.

Useful class/component families seen:
- `DocsCodeEditor_*`
- `PlaygroundBody_*`
- Monaco editor classes and VS Code theme variables.

Loopy adaptation:
- `/v2/playground` should be a sandbox page, not part of guided Learn completion.
- Make the top editor area the main feature; content below explains usage.
- Include language picker, editor, stdin/input, output panel, and Run button.
- Add a clear note: Playground is for free exploration; it does not mark lessons complete.
- Keep `Kiểm tra` out of playground unless tied to a lesson. Playground should primarily run code.
- CTA back into guided flow: `Vào Journey Map` or `Thử lesson mẫu`.

## Tools Capture
Purpose:
- Group standalone developer utilities for search/discovery.

Observed from metadata/content:
- Page describes free online developer tools.
- Tool examples include JSON/SQL formatting, regex test, JWT/Base64 decode, UUID/password generation, text compare.
- It is a utility index, not a learning journey.

Loopy adaptation:
- Not a priority route unless Loopy wants a `/v2/tools` hub.
- For playground page, borrow the idea of utility cards below editor: examples/snippets/tools that support exploration.
- Avoid building a large tools catalog now unless there is a product reason.

## Docs Captures
Purpose:
- Provide reference content by language/concept.
- Docs article can route users to playground or guided course.

Observed structure:
- Shared public shell.
- Docs index and language-specific docs page.
- Language/concept navigation and article-style content are the important patterns.
- Capture references `DocsLanguageMenu_*` and docs code editor/page chunks.

Loopy adaptation:
- `/v2/docs` should likely use a docs shell: left nav, article body, right mini TOC or CTA.
- For now, use docs only as secondary CTA from playground: “Mở docs ngắn về input/output”.
- Do not let docs replace guided lessons for newbies.

## Route Decision
Next implementation route:
- `/v2/playground`

Why:
- Recommended in `CAPTURED-CODDY-INVENTORY.md` after core journey pages.
- Production Loopy already has `/playground`, so v2 sandbox can preview a cleaner public playground without touching the real route.
- It reinforces the product rule that run/playground is separate from lesson validation and completion.

Later route:
- `/v2/docs`

## V2 Playground Requirements
- Public sandbox route `/v2/playground`.
- Shared `V2PublicShell` nav/footer link.
- Static mock data first.
- Top section:
  - Language pills.
  - Large editor mock.
  - Stdin/input panel.
  - Output panel.
  - Run button only; no lesson completion semantics.
- Explanation cards:
  - “Run code freely”.
  - “Use stdin/input”.
  - “Move to guided lesson when ready”.
- Bottom CTA:
  - `Vào Journey Map` -> `/v2/library`.
  - `Thử lesson mẫu` -> `/sample-lesson`.

## Do Not Copy
- Coddy exact SEO copy.
- Monaco CSS/classes.
- Coddy tool claims or package support claims like specific library availability unless Loopy actually supports them.
- Any certificate/social proof claims.
