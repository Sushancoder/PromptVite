# PromptVite (Prompt Autocomplete)

> Local-first prompt saving, improvement, and intelligent autocomplete for AI chat inputs.

PromptVite is a Chrome extension that helps you **write, reuse, and improve prompts without breaking flow**.

It suggests relevant saved prompts inline while you type, lets you improve prompts in-place, and provides a lightweight UI to manage your prompt library — all stored locally.

No accounts. No cloud. No tracking.

---

## Why This Exists

If you work with AI tools regularly, you probably:

- reuse the same prompts and frameworks,
- rewrite prompts to make them clearer or more effective,
- store prompts in docs, notes, or old chats,
- lose time copy-pasting or rethinking phrasing.

The real problem isn’t storing prompts — it’s **writing and recalling good prompts at the moment you need them**.

PromptVite solves that directly inside the input box.

---

## Core Features

### 1. Prompt Saving

- A **Save prompt** button appears below each submitted user prompt.
- Prompts are saved locally.
- Optional lightweight edit before saving (trim, clean, rename).

---

### 2. Inline Prompt Suggestions

- While typing in an AI chat input:
  - the extension analyzes current input text,
  - surfaces up to **3 relevant saved prompts** above the input box.
- Suggestions are similarity-based, not exact matches.

---

### 3. Prompt Improvement

- An **Improve prompt** button appears while typing.
- Refines clarity, structure, or effectiveness of the current prompt.
- Designed for quick iteration, not long rewrites.
- Intended to help users write better prompts without leaving the chat.

---

### 4. Prompt Management UI

- Lightweight UI to:
  - view all saved prompts,
  - edit or delete prompts,
  - see usage frequency and last-used info.
- No heavy organization required.
- Optimized for maintenance, not note-taking.

---

### 5. Keyboard-First Interaction

- `Tab` → select top suggestion
- `↑ / ↓` → navigate suggestions
- `Enter` → insert prompt
- Minimal mouse usage during writing.

---

### 6. Smart Ranking

Prompts are ranked using a weighted combination of:

- similarity to current input,
- usage frequency,
- recent usage (recency bias).

Recent and relevant prompts are favored over old ones.

---

### 7. Privacy by Default

- 100% local storage
- No servers
- No analytics
- No accounts
- Works offline

Your prompts never leave your browser.

---

## How It Works

1. Ask a prompt in an AI chat.
2. Click **Save prompt** below your submitted message.
3. Prompt is stored locally.
4. Start typing a new prompt later.
5. The extension:
   - suggests relevant saved prompts,
   - allows improving the current prompt,
   - enables quick insertion via keyboard.
6. Prompt is sent immediately.

No context switching.

---

## Supported Inputs

- `contenteditable` inputs
- `textarea` inputs

Initial focus:

- ChatGPT-like interfaces

The architecture allows adding adapters for other AI chat tools later (Claude, Gemini, etc.).

---

## Non-Goals

This project is **not**:

- a prompt marketplace,
- a cloud-synced tool,
- a full note-taking app,
- a replacement for AI chat interfaces.

The focus is speed, flow, and recall.

---

## MVP Scope

The MVP is complete if it:

- allows manual prompt saving,
- suggests up to 3 relevant prompts while typing,
- provides a basic prompt improvement action,
- includes a minimal prompt management UI,
- stores everything locally,
- works reliably on at least one major AI chat UI.

---

## Success Criteria

PromptVite is successful if:

- users start expecting suggestions while typing,
- prompt quality improves with less effort,
- typing without the extension feels slower,
- the extension stays installed without conscious effort.

---

## One-Line Value Proposition

**Write better prompts faster — your best prompts, recalled and refined as you type.**

---

## Status

🚧 Early development / MVP phase

---

## License

MIT
