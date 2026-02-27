// Background service worker for PromptVite extension
console.log('PromptVite background service worker loaded');

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'OPEN_OPTIONS') {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        return false;
    }

    if (message.type === 'IMPROVE_PROMPT') {
        handleImprovePrompt(message.text)
            .then(sendResponse)
            .catch((err) => sendResponse({ error: err.message }));
        return true; // keep channel open for async response
    }
});

async function handleImprovePrompt(
    text: string
): Promise<{ improved: string } | { error: string }> {
    const result = await chrome.storage.local.get('geminiApiKey');
    const geminiApiKey = result.geminiApiKey as string | undefined;

    if (!geminiApiKey) {
        return { error: 'NO_KEY' };
    }

    const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [
                        {
                            text: 'You are a prompt engineer. Rewrite the following prompt to be clearer, more specific, and more effective for an AI assistant. Return only the improved prompt text. No explanations, no preamble, no quotes.',
                        },
                    ],
                },
                contents: [{ parts: [{ text }] }],
            }),
        }
    );

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const improved = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!improved) {
        throw new Error('Empty response from Gemini');
    }

    return { improved: improved.trim() };
}

// Optional: Handle side panel
chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {
    console.log('Side panel behavior not set - may not be supported');
});

// To show popup
// chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false }).catch(() => {
//     console.log('Side panel behavior not set - may not be supported');
// });
