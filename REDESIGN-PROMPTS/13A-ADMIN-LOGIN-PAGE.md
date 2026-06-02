# Prompt: Redesign Admin Login Page

## Current Route

- `/admin/login`
- Main file: `src/pages/admin/LoginPage.tsx`

## Current Goal

Authenticate admin users before entering the admin console.

## Current Problems

- Styling and tone can feel disconnected from a serious admin tool.
- Error states should be clear and security-conscious.
- Needs a clean way back to the public site.

## Redesign Goal

Create a focused, trustworthy Loopy Admin login screen.

## Required Structure

1. Brand panel
- “Loopy Admin”.
- Short text: “Quản lý nội dung học, bài nộp và vận hành hệ thống.”

2. Login form
- Email.
- Password.
- Remember me if currently supported.
- Submit button.
- Error state.

3. Security/help area
- Note that admin access requires approved account.
- Link back to main site.

## Functional Requirements

- Preserve current admin auth API and redirect behavior.
- Do not add public signup.
- Do not expose debug details in production.
