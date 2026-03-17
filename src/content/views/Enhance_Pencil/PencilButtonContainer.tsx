import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PencilButton } from './PencilButton';
import { injectTextIntoInput } from '../utils';
import { getSiteAdapter } from '../siteAdapter';

// Resolve the adapter once per module load — hostname is stable for the page lifetime.
const adapter = getSiteAdapter();

/**
 * Manages the pencil (enhance prompt) button portal.
 * Finds the input element and the send/mic button, injecting the pencil
 * button next to it. Works on both ChatGPT and Gemini via the site adapter.
 */
export function PencilButtonContainer() {
    const [enabled, setEnabled] = useState<boolean | null>(null); // null = loading
    const [inputElement, setInputElement] = useState<HTMLElement | null>(null);
    const [targetContainer, setTargetContainer] = useState<HTMLElement | null>(null);
    const [hasInputContent, setHasInputContent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<HTMLElement | null>(null);

    // Read feature flag from storage & listen for live changes
    useEffect(() => {
        chrome.storage.local.get('enhanceEnabled', (result) => {
            setEnabled(result.enhanceEnabled !== false);
        });

        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
            if (area === 'local' && 'enhanceEnabled' in changes) {
                setEnabled(changes.enhanceEnabled.newValue !== false);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    useEffect(() => {
        const checkInputContent = () => {
            if (!inputRef.current) return;
            const text =
                inputRef.current.textContent ||
                (inputRef.current as HTMLTextAreaElement).value ||
                '';
            setHasInputContent(text.trim().length > 0);
        };

        const handleInput = () => {
            checkInputContent();
        };

        const observer = new MutationObserver(() => {
            // 1. Find the input element via adapter
            const currentInput = adapter.getInputElement();

            if (currentInput && currentInput !== inputRef.current) {
                if (inputRef.current) {
                    inputRef.current.removeEventListener('input', handleInput);
                }
                inputRef.current = currentInput;
                setInputElement(currentInput);
                currentInput.addEventListener('input', handleInput);
                checkInputContent();
            }

            // 2. Find the action button and compute our insertion point via adapter
            const actionButton = adapter.getActionButton();
            if (actionButton) {
                const containerId = 'promptvite-pencil-btn-container';
                let container = document.getElementById(containerId);

                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                }

                // Show / hide based on whether there is text in the input
                const text =
                    inputRef.current?.textContent ||
                    (inputRef.current as HTMLTextAreaElement)?.value ||
                    '';
                const hasText = text.trim().length > 0;

                if (hasText) {
                    container.style.display = 'inline-flex';
                    container.style.alignItems = 'center';
                    container.style.marginRight = '4px';
                    container.style.marginLeft = '4px';
                } else {
                    container.style.display = 'none';
                }

                // Use adapter to place the container in the correct spot
                const insertPoint = adapter.getPencilInsertPoint(actionButton);
                if (insertPoint) {
                    const { parent, before } = insertPoint;
                    if (container.parentElement !== parent || container.nextSibling !== before) {
                        parent.insertBefore(container, before);
                    }
                    setTargetContainer(container);
                }

                checkInputContent();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            if (inputRef.current) {
                inputRef.current.removeEventListener('input', handleInput);
            }
            const container = document.getElementById('promptvite-pencil-btn-container');
            if (container) container.remove();
        };
    }, []);

    if (enabled === null || !enabled) return null;
    if (!targetContainer || !hasInputContent || !inputElement) return null;

    return createPortal(
        <PencilButton
            isLoading={isLoading}
            theme={adapter.theme}
            onClick={async () => {
                const text = inputRef.current?.textContent || (inputRef.current as HTMLTextAreaElement)?.value || '';
                const trimmedText = text.trim();
                if (!trimmedText) return;

                // Check for API key — open options if missing
                const result = await chrome.storage.local.get('geminiApiKey');
                if (!result.geminiApiKey) {
                    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
                    return;
                }

                // Call background worker to improve the prompt
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
                        injectTextIntoInput(inputElement, response.improved);
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
    );
}
