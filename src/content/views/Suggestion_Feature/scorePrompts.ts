import Fuse from 'fuse.js';
import { type Prompt } from '@/lib/promptStorage';

export function scorePrompts(query: string, prompts: Prompt[]): Prompt[] {
    if (!query.trim()) return [];

    const fuse = new Fuse(prompts, {
        keys: [
            { name: 'name', weight: 3.0 },
            { name: 'tags', weight: 2.0 },
            { name: 'prompt', weight: 1.0 }
        ],
        threshold: 0.4, // Allows typos but remains reasonably strict
        ignoreLocation: true,
        includeScore: true,
    });

    const searchResults = fuse.search(query);

    const scoredPrompts = searchResults.map(result => {
        const prompt = result.item;
        
        // Fuse.js score ranges from 0.0 (perfect match) to 1.0 (mismatch).
        // We invert it so higher is better, and scale it up.
        // A perfect text match gives 1.0 * 4.0 = ~4.0 text match score.
        const fuseScore = 1 - (result.score || 0); 
        const textMatchScore = fuseScore * 4.0;

        let recencyScore = 0;
        if (prompt.lastUsedAt) {
            const daysSince = Math.max(0, (Date.now() - prompt.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24));
            recencyScore = 1 / (daysSince + 1);
        }

        // Final weighted score calculation
        const score = (textMatchScore * 3.0) + ((prompt.usageCount || 0) * 0.5) + (recencyScore * 1.5);

        return { prompt, score };
    });

    // Sort descending by our final weighted score and return top 3
    return scoredPrompts
        .sort((a, b) => b.score - a.score)
        .map(item => item.prompt)
        .slice(0, 3);
}
