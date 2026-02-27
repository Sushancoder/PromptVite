import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PencilButton } from './PencilButton'
import './App.css'

/**
 * Injects text into ChatGPT's contenteditable input field.
 * Uses execCommand because it's the only reliable way to update
 * a React-controlled contenteditable element and trigger React's
 * internal change detection.
 */
function injectTextIntoInput(el: HTMLElement, text: string) {
  el.focus();
  document.execCommand('selectAll', false);
  document.execCommand('insertText', false, text);
}

function App() {
  const [targetContainer, setTargetContainer] = useState<HTMLElement | null>(null)
  const [hasInputContent, setHasInputContent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let inputElement: HTMLElement | null = null;

    const checkInputContent = () => {
      if (inputElement) {
        const text =
          inputElement.textContent ||
          (inputElement as HTMLTextAreaElement).value ||
          '';
        setHasInputContent(text.trim().length > 0);
      }
    };

    const observer = new MutationObserver(() => {
      // Selector for the microphone button or Send button (when typing)
      const actionButton = document.querySelector('button[aria-label="Use microphone"]') ||
        document.querySelector('button[data-testid="voice-mode-button"]') ||
        document.querySelector('button[data-testid="send-button"]') ||
        document.querySelector('button[aria-label="Send prompt"]');

      if (actionButton && actionButton.parentElement) {
        // specific ID for our container to avoid duplicates
        const containerId = 'promptvite-pencil-btn-container';
        let container = document.getElementById(containerId);

        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
        }

        // Apply/Update styles
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.marginRight = '8px'; // Add some spacing
        // Remove old margin-left if it exists (from previous versions)
        container.style.marginLeft = '';

        // Ensure it is in the DOM and in the right place
        if (container.parentElement !== actionButton.parentElement || container.nextSibling !== actionButton) {
          // Insert BEFORE the action button (mic or send)
          actionButton.parentElement.insertBefore(container, actionButton);
        }
        // Always update state to ensure Portal catches up
        setTargetContainer(container);
      }

      // Find the ChatGPT input and attach a listener if not already done
      const newInput = document.querySelector<HTMLElement>('#prompt-textarea') ??
        document.querySelector<HTMLElement>('div[contenteditable="true"]');

      if (newInput && newInput !== inputElement) {
        inputElement?.removeEventListener('input', checkInputContent);
        inputElement = newInput;
        inputElement.addEventListener('input', checkInputContent);
      }

      // Also re-check on every mutation (catches programmatic clears after send)
      checkInputContent();
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect();
      inputElement?.removeEventListener('input', checkInputContent);
      const container = document.getElementById('promptvite-pencil-btn-container');
      if (container) container.remove();
    }
  }, [])

  if (!targetContainer || !hasInputContent) return null

  return createPortal(
    <PencilButton
      isLoading={isLoading}
      onClick={async () => {
        // 1. Read current input text
        const inputEl = document.querySelector<HTMLElement>('#prompt-textarea')
          ?? document.querySelector<HTMLElement>('div[contenteditable="true"]');
        const text = inputEl?.textContent?.trim();
        if (!text || !inputEl) return;

        // 2. Check for API key — open options if missing
        const result = await chrome.storage.local.get('geminiApiKey');
        if (!result.geminiApiKey) {
          chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
          return;
        }

        // 3. Call background worker to improve the prompt
        setIsLoading(true);
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'IMPROVE_PROMPT',
            text,
          });

          if (chrome.runtime.lastError) {
            console.error('[PromptVite] Message error:', chrome.runtime.lastError.message);
            return;
          }

          if (response?.improved) {
            injectTextIntoInput(inputEl, response.improved);
          } else if (response?.error) {
            console.error('[PromptVite] Gemini error:', response.error);
          }
        } catch (err) {
          console.error('[PromptVite] Failed to improve prompt:', err);
        } finally {
          setIsLoading(false);
        }
      }}
    />,
    targetContainer
  )
}

export default App
