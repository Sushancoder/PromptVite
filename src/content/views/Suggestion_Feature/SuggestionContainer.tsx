import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SuggestionDropdown } from './SuggestionDropdown';
import { type Prompt, loadPrompts, incrementUsage } from '@/lib/promptStorage';
import { scorePrompts } from './scorePrompts';
import { replaceTokenAtCursor } from '../utils';
import { getSiteAdapter } from '../siteAdapter';

// Resolve the adapter once per module load — hostname is stable for the page lifetime.
const adapter = getSiteAdapter();

export function SuggestionContainer() {
    const [enabled, setEnabled] = useState<boolean | null>(null); // null = loading
    const [targetContainer, setTargetContainer] = useState<HTMLElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Prompt[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLElement | null>(null);
    const promptsRef = useRef<Prompt[]>([]);

    // Read feature flag from storage & listen for changes
    useEffect(() => {
        chrome.storage.local.get('suggestionEnabled', (result) => {
            setEnabled(result.suggestionEnabled !== false);
        });

        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
            if (area === 'local' && 'suggestionEnabled' in changes) {
                setEnabled(changes.suggestionEnabled.newValue !== false);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);
    
    // We need these in refs for the keydown listener (which runs outside normal react render cycle)
    const isOpenRef = useRef(false);
    const suggestionsRef = useRef<Prompt[]>([]);
    const activeIndexRef = useRef(0);
    const matchLengthRef = useRef(0);

    // Sync refs with state
    useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
    useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

    useEffect(() => {
        // Init prompts
        loadPrompts().then(p => { promptsRef.current = p; });

        // Storage listener for cross-tab updates
        const storageListener = (changes: any, area: string) => {
            if (area === 'local' && changes.prompts) {
                loadPrompts().then(p => { promptsRef.current = p; });
            }
        };
        chrome.storage.onChanged.addListener(storageListener);
        return () => chrome.storage.onChanged.removeListener(storageListener);
    }, []);

    const handleSelect = async (prompt: Prompt) => {
        if (!inputRef.current) return;
        
        replaceTokenAtCursor(inputRef.current, matchLengthRef.current, prompt.prompt);
        await incrementUsage(prompt.id);
        
        setIsOpen(false);
    };

    useEffect(() => {
        const handleInput = () => {
            if (!inputRef.current) return;
            
            // To get exactly what was just typed, textContent is usually sufficient.
            // Using window.getSelection could be more accurate for mid-string edits,
            // but for simplicity we assume the token is at the end of the text block the cursor is in.
            // A more robust way: use the exact selection offset to slice the text.
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                setIsOpen(false);
                return;
            }

            const range = selection.getRangeAt(0);
            const node = range.startContainer;
            
            // text up to the cursor in current text node
            const textToCursor = node.textContent?.slice(0, range.startOffset) || ""; 
            
            // Match # followed by word chars or hyphens, up to the cursor
            // \w is [A-Za-z0-9_]
            const match = textToCursor.match(/#([\w-]*)$/);
            
            if (match) {
                const query = match[1];
                const scored = scorePrompts(query, promptsRef.current);
                
                if (scored.length > 0) {
                    setSuggestions(scored);
                    setActiveIndex(0);
                    setIsOpen(true);
                    matchLengthRef.current = match[0].length; 
                } else {
                    setIsOpen(false);
                }
            } else {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpenRef.current) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(prev => Math.min(suggestionsRef.current.length - 1, prev + 1));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(suggestionsRef.current[activeIndexRef.current]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        const observer = new MutationObserver(() => {
            // Find the input element via adapter
            const currentInput = adapter.getInputElement();

            if (currentInput && currentInput !== inputRef.current) {
                if (inputRef.current) {
                    inputRef.current.removeEventListener('input', handleInput);
                    inputRef.current.removeEventListener('keydown', handleKeyDown, true);
                }
                
                inputRef.current = currentInput;
                
                currentInput.addEventListener('input', handleInput);
                // Use capture phase to intercept keys before the host page submits
                currentInput.addEventListener('keydown', handleKeyDown, true);
                
                // Create a global container for suggestions if it doesn't exist
                const containerId = 'promptvite-suggestion-container';
                let container = document.getElementById(containerId);
                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                    container.style.position = 'fixed'; // Use fixed to bypass container overflows
                    container.style.top = '0';
                    container.style.left = '0';
                    container.style.width = '100vw';
                    container.style.height = '100vh';
                    container.style.pointerEvents = 'none'; // Don't block background clicks
                    container.style.zIndex = '10000000';
                    document.body.appendChild(container);
                }
                setTargetContainer(container);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            if (inputRef.current) {
                inputRef.current.removeEventListener('input', handleInput);
                inputRef.current.removeEventListener('keydown', handleKeyDown as EventListener, true);
            }
            const container = document.getElementById('promptvite-suggestion-container');
            if (container) container.remove();
        };
    }, []);

    if (enabled === null || !enabled) return null;
    if (!isOpen || !targetContainer || suggestions.length === 0) return null;

    return createPortal(
        <SuggestionDropdown
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onClose={() => setIsOpen(false)}
            inputElement={inputRef.current!}
        />,
        targetContainer
    );
}
