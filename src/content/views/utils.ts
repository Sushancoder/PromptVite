/**
 * Injects text into a contenteditable input field (works on ChatGPT and Gemini).
 * Uses execCommand because it's the only reliable way to update a
 * framework-controlled contenteditable element and trigger its internal
 * change detection (React, Angular/Quill, etc.).
 */
export function injectTextIntoInput(el: HTMLElement, text: string) {
    el.focus();
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, text);
}

/**
 * Replaces a generic token just typed by the user.
 * Deletes N characters backwards from current cursor, then inserts replacement.
 */
export function replaceTokenAtCursor(el: HTMLElement, tokenLength: number, replacement: string) {
    el.focus();
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Safety check to ensure we are operating on a valid text or element node offset
        const startOffset = Math.max(0, range.endOffset - tokenLength);
        
        try {
            range.setStart(range.endContainer, startOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (err) {
            console.error('[PromptVite] Failed to select token range:', err);
        }
    }
    
    // execCommand insertText replaces the current selection and triggers React state correctly.
    document.execCommand('insertText', false, replacement);
}

/** Prompt shape stored in chrome.storage.local */
export interface Prompt {
    id: string;
    name: string;
    prompt: string;
    tags: string[];
    createdAt: string; // ISO string when serialized in storage
}
