/**
 * Site adapter pattern — provides site-specific DOM selectors so both
 * PencilButtonContainer and SuggestionContainer can work across multiple
 * AI chat platforms without duplicating logic.
 */

export interface SiteAdapter {
    /** Find the main contenteditable / textarea input element */
    getInputElement: () => HTMLElement | null;
    /** Find the action (send / mic) button to anchor the pencil next to */
    getActionButton: () => Element | null;
    /**
     * Given the found action button, return the parent element and the
     * "insert before" reference node for our pencil container div.
     */
    getPencilInsertPoint: (actionButton: Element) => { parent: HTMLElement; before: Element } | null;
    /**
     * Given the input element, return the element whose parent will hold
     * the suggestion dropdown portal container.
     */
    getSuggestionAnchorParent: (input: HTMLElement) => HTMLElement | null;
    /** Theme-specific colors and styles for our injected UI */
    theme: {
        pencilColor: string;
        pencilHoverColor: string;
        pencilHoverBackground: string;
    }
}

// ---------------------------------------------------------------------------
// ChatGPT adapter
// ---------------------------------------------------------------------------
const chatgptAdapter: SiteAdapter = {
    getInputElement: () =>
        document.querySelector<HTMLElement>('#prompt-textarea') ??
        document.querySelector<HTMLElement>('div[contenteditable="true"]'),

    getActionButton: () =>
        document.querySelector('button[aria-label="Use microphone"]') ||
        document.querySelector('button[aria-label="Start Voice"]') ||
        document.querySelector('button[data-testid="composer-speech-button"]') ||
        document.querySelector('button[data-testid="voice-mode-button"]') ||
        document.querySelector('button[data-testid="send-button"]') ||
        document.querySelector('button[aria-label="Send prompt"]'),

    getPencilInsertPoint: (actionButton) => {
        if (!actionButton.parentElement) return null;
        return { parent: actionButton.parentElement, before: actionButton };
    },

    getSuggestionAnchorParent: (input) =>
        input.closest('form')?.parentElement ?? null,
    theme: {
        pencilColor: 'var(--text-secondary, #666)',
        pencilHoverColor: 'var(--text-primary, #000)',
        pencilHoverBackground: 'var(--token-main-surface-secondary, rgba(0,0,0,0.1))',
    },
};

// ---------------------------------------------------------------------------
// Gemini adapter
// ---------------------------------------------------------------------------
// Input:  div.ql-editor[contenteditable="true"]  (inside <rich-textarea>)
// Send:   button[aria-label="Send message"]
//           ↳ parent: div.send-button-container
//               ↳ parent: div.input-buttons-wrapper-bottom   ← pencil goes here
// Suggestion anchor: parent of div.text-input-field_textarea-wrapper
// ---------------------------------------------------------------------------
const geminiAdapter: SiteAdapter = {
    getInputElement: () =>
        document.querySelector<HTMLElement>('div.ql-editor[contenteditable="true"]') ??
        document.querySelector<HTMLElement>('rich-textarea div[contenteditable="true"]'),

    getActionButton: () =>
        document.querySelector('button[aria-label="Send message"]'),

    getPencilInsertPoint: (actionButton) => {
        // Navigate up: button → div.send-button-container → div.input-buttons-wrapper-bottom
        const sendContainer = actionButton.closest('.send-button-container');
        const buttonsWrapper = sendContainer?.parentElement as HTMLElement | null;
        if (!sendContainer || !buttonsWrapper) return null;
        return { parent: buttonsWrapper, before: sendContainer };
    },

    getSuggestionAnchorParent: (input) => {
        const wrapper = input.closest('.text-input-field_textarea-wrapper') as HTMLElement | null;
        return wrapper?.parentElement ?? null;
    },
    theme: {
        pencilColor: '#E3E3E3', // Brighter icon color by default on Gemini
        pencilHoverColor: '#FFFFFF', // Pure white on hover
        pencilHoverBackground: 'rgba(255, 255, 255, 0.15)', // More prominent hover surface
    },
};

// ---------------------------------------------------------------------------
// Factory — called once per module load (hostname is stable for page lifetime)
// ---------------------------------------------------------------------------
export function getSiteAdapter(): SiteAdapter {
    if (window.location.hostname.includes('gemini.google.com')) {
        return geminiAdapter;
    }
    return chatgptAdapter;
}
