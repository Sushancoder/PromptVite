import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Copy, Check, Search, Plus, Minus, Settings, Pencil } from 'lucide-react'
import { type Prompt, loadPrompts, savePrompts } from '@/lib/promptStorage'


export default function Main() {

    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [name, setName] = useState('')
    const [prompt, setPrompt] = useState('')
    const [tags, setTags] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchPrompts = async () => {
            const loaded = await loadPrompts()
            setPrompts(loaded)
        }
        fetchPrompts()
    }, [])

    const saveToStorage = (updatedPrompts: Prompt[]) => {
        savePrompts(updatedPrompts)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !prompt.trim()) {
            return
        }

        const promptTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

        if (editingId) {
            const updatedPrompts = prompts.map(p => 
                p.id === editingId 
                    ? { ...p, name: name.trim(), prompt: prompt.trim(), tags: promptTags }
                    : p
            )
            setPrompts(updatedPrompts)
            saveToStorage(updatedPrompts)
            setEditingId(null)
        } else {
            const newPrompt: Prompt = {
                id: Date.now().toString(),
                name: name.trim(),
                prompt: prompt.trim(),
                tags: promptTags,
                createdAt: new Date(),
                usageCount: 0,
                lastUsedAt: null
            }
            const updatedPrompts = [newPrompt, ...prompts]
            setPrompts(updatedPrompts)
            saveToStorage(updatedPrompts)
        }

        // Clear form and hide it
        setName('')
        setPrompt('')
        setTags('')
        setShowCreateForm(false)
    }

    const handleEdit = (p: Prompt) => {
        setName(p.name)
        setPrompt(p.prompt)
        setTags(p.tags.join(', '))
        setEditingId(p.id)
        setShowCreateForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
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
                onClick={() => {
                    if (showCreateForm) {
                        setEditingId(null);
                        setName('');
                        setPrompt('');
                        setTags('');
                    }
                    setShowCreateForm(!showCreateForm);
                }}
                variant="outline"
                className="w-full mb-6 cursor-pointer"
            >
                {showCreateForm ? <Minus className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {showCreateForm ? 'Hide Form' : 'Create New Prompt'}
            </Button>

            {showCreateForm && (
                <div className="mb-8 rounded-xl border border-primary/30 bg-card/60 backdrop-blur-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-primary/10 bg-primary/5">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            {editingId ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                            {editingId ? 'Edit Prompt' : 'Create New Prompt'}
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-primary/80 ml-1">
                                Name (Shortcut)
                            </label>
                            <Input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Stock Research, Code Review"
                                className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="prompt" className="text-[10px] font-bold uppercase tracking-wider text-primary/80 ml-1">
                                Prompt (Content)
                            </label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="The content that will replace the shortcut..."
                                rows={4}
                                className="bg-background/50 border-primary/20 focus-visible:ring-primary/30 min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="tags" className="text-[10px] font-bold uppercase tracking-wider text-primary/80 ml-1">
                                Tags (Optional)
                            </label>
                            <Input
                                type="text"
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g. coding, email, productivity"
                                className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                            />
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]">
                            Save Prompt
                        </Button>
                    </form>
                </div>
            )}

            {/* Pro Tip - Shortcut Mention */}
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 backdrop-blur-sm flex items-center gap-4 group hover:border-primary/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold text-lg">#</span>
                </div>
                <div className="flex-1 text-sm leading-snug">
                    <p className="font-bold text-foreground mb-0.5">Quick Search Shortcut</p>
                    <p className="text-muted-foreground">
                        Type <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs border border-border">#</kbd> directly in any chat to search and insert your prompts instantly.
                    </p>
                </div>
            </div>

            {/* Prompts List - Minimal Design */}
            <div className="prompts-list">
            {/* Prompts List - Modern Card Design */}
            <div className="prompts-list pb-20">
                {prompts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/50 transition-all">
                        <p className="text-lg font-medium">No prompts saved yet.</p>
                        <p className="text-sm mt-2 opacity-70">Click the button above to create your first one.</p>
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl">
                        <p>No prompts found matching <span className="text-foreground font-semibold">"{searchQuery}"</span></p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPrompts.map((p) => {
                            const isExpanded = expandedIds.has(p.id)
                            const shouldTruncate = p.prompt.length > 120
                            const displayText = isExpanded || !shouldTruncate
                                ? p.prompt
                                : p.prompt.slice(0, 120) + '...'

                            return (
                                <div
                                    key={p.id}
                                    className={`
                                        group relative overflow-hidden rounded-xl border border-primary/25 
                                        bg-card/40 backdrop-blur-sm transition-all duration-300 
                                        hover:border-primary/60 hover:bg-muted/40 hover:shadow-lg
                                        cursor-pointer
                                        ${isExpanded ? 'border-primary/50 ring-2 ring-primary/30 bg-muted/50' : ''}
                                    `}
                                    onClick={() => toggleExpand(p.id)}
                                >
                                    <div className="p-5">
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {p.name}
                                                </h3>
                                                {p.tags && p.tags.length > 0 && (
                                                    <div className="hidden sm:flex items-center gap-2">
                                                        {p.tags.slice(0, 3).map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-md"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {p.tags.length > 3 && (
                                                            <span className="text-xs text-muted-foreground font-medium">
                                                                +{p.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(p)
                                                    }}
                                                    className="p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all cursor-pointer shadow-sm"
                                                    aria-label="Edit prompt"
                                                    title="Edit prompt"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCopy(p.id, p.prompt)
                                                    }}
                                                    className="p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-sm"
                                                    aria-label="Copy prompt"
                                                    title="Copy prompt"
                                                >
                                                    {copiedId === p.id ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(p.id)
                                                    }}
                                                    className="p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all cursor-pointer shadow-sm"
                                                    aria-label="Delete prompt"
                                                    title="Delete prompt"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preview / Expanded Content */}
                                        <div className="relative mt-3">
                                            <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                {isExpanded ? p.prompt : displayText}
                                            </p>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                                                        Added {p.createdAt instanceof Date && !isNaN(p.createdAt.getTime())
                                                            ? p.createdAt.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })
                                                            : 'Recently'
                                                        }
                                                    </span>
                                                </div>
                                                
                                                {p.tags && p.tags.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {p.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-muted text-muted-foreground border border-border/50"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
            </div>

            {/* Fixed Footer - Keyboard Shortcut Hint */}
            <div className="fixed bottom-0 left-0 right-0 py-2 px-4 bg-background/80 backdrop-blur-sm border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Press <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-foreground font-mono text-xs">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-foreground font-mono text-xs">Shift</kbd>+  
                     <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-foreground font-mono text-xs">Y</kbd> to toggle sidebar
                </p>
            </div>
        </div>
    )
}
