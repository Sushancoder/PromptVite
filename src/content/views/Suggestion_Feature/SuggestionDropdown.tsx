import { useEffect, useRef, useState } from 'react';
import { type Prompt } from '@/lib/promptStorage';

interface SuggestionDropdownProps {
    suggestions: Prompt[];
    activeIndex: number;
    onSelect: (prompt: Prompt) => void;
    onClose: () => void;
    inputElement: HTMLElement; // Added to calculate positioning
}

export function SuggestionDropdown({ suggestions, activeIndex, onSelect, inputElement }: SuggestionDropdownProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

    // Calculate position
    useEffect(() => {
        const updatePosition = () => {
            const rect = inputElement.getBoundingClientRect();
            // Align dropdown to the input's left and sit just above it
            setStyle({
                position: 'fixed',
                bottom: `${window.innerHeight - rect.top + 12}px`,
                left: `${rect.left}px`,
                width: 'max-content',
                maxWidth: `min(700px, ${window.innerWidth - rect.left - 20}px)`, // Don't overflow right edge
                minWidth: '380px',
                maxHeight: '45vh',
                overflowY: 'auto',
                backgroundColor: 'rgba(32, 33, 35, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(255, 255, 255, 0.05)',
                zIndex: 10000000,
                pointerEvents: 'auto', // Re-enable pointer events for the dropdown itself
                color: '#ececf1',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                scrollBehavior: 'smooth',
                visibility: 'visible'
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [inputElement, suggestions.length]);

    // Scroll active item into view
    useEffect(() => {
        if (containerRef.current) {
            const activeEl = containerRef.current.children[activeIndex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    if (suggestions.length === 0) return null;

    return (
        <div style={style}>
            <div ref={containerRef} style={{ flexGrow: 1 }}>
                {suggestions.map((p, index) => {
                    const isActive = index === activeIndex;
                    return (
                            <div
                                key={p.id}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input from losing focus
                                    onSelect(p);
                                }}
                                style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                transition: 'background-color 0.1s ease',
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{p.name}</span>
                                {p.tags && p.tags.length > 0 && (
                                    <span style={{ fontSize: '10px', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '1px 4px' }}>
                                        {p.tags[0]}
                                    </span>
                                )}
                            </div>
                            <div 
                                style={{ 
                                    fontSize: '12px', 
                                    lineHeight: '1.5',
                                    color: 'rgba(255, 255, 255, 0.6)', 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    marginTop: '4px'
                                }}
                            >
                                {p.prompt}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Footer with keyboard hints */}
            <div 
                style={{ 
                    padding: '6px 16px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
                    backgroundColor: '#18181b',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <span><b>⬆/⬇</b> navigate</span>
                <span><b>Enter/Tab</b> select</span>
                <span><b>Esc</b> dismiss</span>
            </div>
        </div>
    );
}
