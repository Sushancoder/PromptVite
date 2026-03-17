import { useState } from 'react';

const PencilIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '1.5rem', height: '1.5rem' }}
    >
        <path
            d="M12.2424 20H17.5758M4.48485 16.5L15.8242 5.25607C16.5395 4.54674 17.6798 4.5061 18.4438 5.16268V5.16268C19.2877 5.8879 19.3462 7.17421 18.5716 7.97301L7.39394 19.5L4 20L4.48485 16.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
        />
    </svg>
);

const Spinner = () => (
    <div
        style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'promptvite-spin 0.6s linear infinite',
        }}
    />
);



// Inject keyframes for the spinner (content scripts can't use external CSS on the host page)
if (!document.getElementById('promptvite-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'promptvite-spinner-style';
    style.textContent = '@keyframes promptvite-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}

interface PencilButtonProps {
    onClick?: () => void;
    isLoading?: boolean;
    theme: {
        pencilColor: string;
        pencilHoverColor: string;
        pencilHoverBackground: string;
    };
}

export const PencilButton = ({ onClick, isLoading, theme }: PencilButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                color: isHovered ? theme.pencilHoverColor : theme.pencilColor,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: 'none',
                background: isHovered && !isLoading ? theme.pencilHoverBackground : 'transparent',
                opacity: isLoading ? 0.6 : 1,
                transform: isHovered && !isLoading ? 'scale(1.08)' : 'scale(1)',
                boxShadow: isHovered && !isLoading ? '0 0 15px rgba(255, 255, 255, 0.1)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            aria-label={isLoading ? 'Improving prompt...' : 'Enhance prompt'}
            title={isLoading ? 'Improving...' : 'Enhance'}
            type="button"
        >
            {isLoading ? <Spinner /> : <PencilIcon />}
        </button>
    );
};
