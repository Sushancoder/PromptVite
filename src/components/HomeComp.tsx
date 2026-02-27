import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Copy, Check, Search, Plus, Minus, Settings } from 'lucide-react'


export default function Main() {

    interface Prompt {
        id: string
        name: string
        prompt: string
        tags: string[]
        createdAt: Date
    }

    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [name, setName] = useState('')
    const [prompt, setPrompt] = useState('')
    const [tags, setTags] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)

    useEffect(() => {
        // Load prompts from storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['prompts'], (result) => {
                if (result.prompts) {
                    // Convert serialized date strings back to Date objects
                    const loadedPrompts = (result.prompts as any[]).map((p: any) => {
                        let parsedDate = new Date(p.createdAt)
                        // Fallback to current date if invalid
                        if (isNaN(parsedDate.getTime())) {
                            parsedDate = new Date()
                        }
                        return {
                            ...p,
                            createdAt: parsedDate
                        }
                    })
                    setPrompts(loadedPrompts)
                }
            })
        }
    }, [])

    const saveToStorage = (updatedPrompts: Prompt[]) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            // Serialize dates as ISO strings for reliable storage
            const serializedPrompts = updatedPrompts.map(p => ({
                ...p,
                createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date().toISOString()
            }))
            chrome.storage.local.set({ prompts: serializedPrompts })
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !prompt.trim()) {
            return
        }

        const newPrompt: Prompt = {
            id: Date.now().toString(),
            name: name.trim(),
            prompt: prompt.trim(),
            tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            createdAt: new Date()
        }

        // Add new prompt at the beginning of the array
        const updatedPrompts = [newPrompt, ...prompts]
        setPrompts(updatedPrompts)
        saveToStorage(updatedPrompts)

        // Clear form and hide it
        setName('')
        setPrompt('')
        setTags('')
        setShowCreateForm(false)
    }

    const handleDelete = (id: string) => {
        const updatedPrompts = prompts.filter(p => p.id !== id)
        setPrompts(updatedPrompts)
        saveToStorage(updatedPrompts)
    }

    const handleCopy = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    // Filter prompts based on search query
    const filteredPrompts = prompts.filter(p => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            p.name.toLowerCase().includes(query) ||
            p.prompt.toLowerCase().includes(query) ||
            p.tags.some(tag => tag.toLowerCase().includes(query))
        )
    })

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">PromptVite</h1>
                <button
                    onClick={() => chrome.runtime.openOptionsPage()}
                    className="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Open settings"
                    title="Settings"
                >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search prompts by name, content, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Toggle Create Form Button */}
            <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="outline"
                className="w-full mb-6 cursor-pointer"
            >
                {showCreateForm ? <Minus className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {showCreateForm ? 'Hide Form' : 'Create New Prompt'}
            </Button>

            {showCreateForm && (
                <div className="mb-6 border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-medium text-foreground">Create New Prompt</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm text-muted-foreground">
                                Name (shortcut)
                            </label>
                            <Input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter prompt name..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="prompt" className="text-sm text-muted-foreground">
                                Prompt
                            </label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your prompt..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="tags" className="text-sm text-muted-foreground">
                                Tags (optional, comma separated)
                            </label>
                            <Input
                                type="text"
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g. coding, writing, assistant"
                            />
                        </div>

                        <Button type="submit" className="w-full cursor-pointer">
                            Save Prompt
                        </Button>
                    </form>
                </div>
            )}

            {/* Prompts List - Minimal Design */}
            <div className="prompts-list">
                {prompts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No prompts saved yet.</p>
                        <p className="text-sm mt-1">Click the button above to create your first one.</p>
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No prompts found matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                        {filteredPrompts.map((p, index) => {
                            const isExpanded = expandedIds.has(p.id)
                            const shouldTruncate = p.prompt.length > 80
                            const displayText = isExpanded || !shouldTruncate
                                ? p.prompt
                                : p.prompt.slice(0, 80) + '...'

                            return (
                                <div
                                    key={p.id}
                                    className={`group p-4 hover:bg-muted/30 transition-colors ${index !== filteredPrompts.length - 1 ? 'border-b border-border' : ''
                                        }`}
                                    onClick={() => toggleExpand(p.id)}
                                    title="Click to expand"
                                >
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <h3 className="font-medium text-foreground truncate">
                                                {p.name}
                                            </h3>
                                            {p.tags && p.tags.length > 0 && (
                                                <div className="hidden sm:flex items-center gap-1.5">
                                                    {p.tags.slice(0, 2).map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {p.tags.length > 2 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{p.tags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleCopy(p.id, p.prompt)
                                                }}
                                                className="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                                                aria-label="Copy prompt"
                                                title="Copy prompt"
                                            >
                                                {copiedId === p.id ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(p.id)
                                                }}
                                                className="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                                aria-label="Delete prompt"
                                                title="Delete prompt"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview / Expanded Content */}
                                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap break-all">
                                        {displayText}
                                    </p>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {p.createdAt instanceof Date && !isNaN(p.createdAt.getTime())
                                                    ? p.createdAt.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })
                                                    : 'Unknown date'
                                                }
                                            </span>
                                            {p.tags && p.tags.length > 0 && (
                                                <div className="flex items-center gap-1.5 sm:hidden">
                                                    {p.tags.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Fixed Footer - Keyboard Shortcut Hint */}
            <div className="fixed bottom-0 left-0 right-0 py-2 px-4 bg-background/80 backdrop-blur-sm border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Press <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-foreground font-mono text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-foreground font-mono text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-foreground font-mono text-xs">Y</kbd> to toggle sidebar
                </p>
            </div>
        </div>
    )
}
