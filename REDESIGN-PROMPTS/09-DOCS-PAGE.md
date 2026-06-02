# Prompt: Redesign Docs Page

## Current Route

- `/docs`
- Main file: `src/pages/DocsPage.tsx`

## Current Goal

Show static learning resources for JavaScript, Python, C++.

## Current Problems

- Docs page feels like a separate resource catalog, not connected to learning journey.
- Category filter only has `all`, so it adds UI without value.
- Modal opens links, but no guidance on when to use docs.
- Docs may distract beginners if presented too early.

## Redesign Goal

Make Docs a “Resource Shelf” that supports current learning paths.

## Required Structure

1. Header
- “Tài nguyên khi bạn bị kẹt.”
- Explain docs are references, not the main path.

2. Recommended resources
- Group by language.
- Show beginner-friendly first.

3. Search
- Keep search but simplify category filter unless real categories exist.

4. Resource modal/detail
- Show links with labels:
- Official docs.
- Beginner tutorial.
- Practice reference.

5. Journey CTA
- “Không biết bắt đầu từ đâu? Quay lại lộ trình.”

## Functional Requirements

- Preserve static `useDocumentationTechnologies` and `useDocumentationLinks`.
- Preserve external link behavior.
- Improve empty state and no-results state.
