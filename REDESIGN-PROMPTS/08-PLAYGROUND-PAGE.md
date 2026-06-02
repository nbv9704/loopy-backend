# Prompt: Redesign Playground Page

## Current Route

- `/playground`
- Main files:
- `src/pages/PlaygroundPage.tsx`
- `src/components/playground/MultiFileEditor.tsx`
- `src/components/playground/FileExplorer.tsx`
- `src/components/playground/CodeEditorPane.tsx`
- `src/components/playground/TerminalOutput.tsx`

## Current Goal

Free multi-file coding playground with auto-save and backend execution.

## Current Problems

- Actions require login but the page itself is public, so guest may hit surprise redirects.
- When opened from lesson, there is no strong “back to lesson” context.
- Multi-file support is powerful but unclear: only active file runs.
- No guided experiment prompts for beginners.
- No rename/template/history.

## Redesign Goal

Reframe Playground as “Loopy Lab”: free experimentation that extends lessons.

## Required Structure

1. Lab header
- Title: “Loopy Lab”.
- Explain active file execution.
- If opened from lesson: show lesson context and “Quay lại bài học”.

2. Guided experiments panel
- Cards like:
- “Đổi một giá trị và dự đoán output.”
- “Thêm một dòng print.”
- “Tạo lỗi thử rồi sửa.”

3. Editor layout
- File explorer.
- Code editor.
- Terminal.
- Run button always obvious.

4. Guest state
- Allow editing preview if desired.
- Before run, show clear login prompt: “Đăng nhập để chạy và lưu code.”

## Functional Requirements

- Preserve localStorage file persistence.
- Preserve `api.executeCode()`.
- Preserve import from lesson route state.
- Add clear active-file messaging.
