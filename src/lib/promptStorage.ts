import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Prompt {
    id: string;
    name: string;
    prompt: string;
    tags: string[];
    createdAt: Date;
    usageCount: number;
    lastUsedAt: Date | null;
}

export const loadPrompts = async (): Promise<Prompt[]> => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return [];
    }
    
    // Manifest V3 `chrome.storage.local.get` natively returns a Promise!
    const result = await chrome.storage.local.get(['prompts']);
    
    if (!result.prompts) {
        return [];
    }
    
    return (result.prompts as any[]).map((p: any) => {
        let parsedDate = new Date(p.createdAt);
        if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date();
        }
        
        let parsedLastUsed = p.lastUsedAt ? new Date(p.lastUsedAt) : null;
        if (parsedLastUsed && isNaN(parsedLastUsed.getTime())) {
            parsedLastUsed = null;
        }

        return {
            ...p,
            createdAt: parsedDate,
            usageCount: p.usageCount ?? 0,
            lastUsedAt: parsedLastUsed,
        } as Prompt;
    });
};

export const savePrompts = async (prompts: Prompt[]): Promise<void> => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return;
    }
    
    const serializedPrompts = prompts.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date().toISOString(),
        lastUsedAt: p.lastUsedAt instanceof Date ? p.lastUsedAt.toISOString() : null,
    }));
    
    await chrome.storage.local.set({ prompts: serializedPrompts });
};

export const incrementUsage = async (id: string): Promise<void> => {
    const prompts = await loadPrompts();
    const updatedPrompts = prompts.map(p => {
        if (p.id === id) {
            return {
                ...p,
                usageCount: p.usageCount + 1,
                lastUsedAt: new Date(),
            };
        }
        return p;
    });
    await savePrompts(updatedPrompts);
};
