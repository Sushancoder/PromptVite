import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type KeyStatus = 'loading' | 'saved' | 'empty'

export default function App() {
    const [apiKey, setApiKey] = useState('')
    const [status, setStatus] = useState<KeyStatus>('loading')

    const [suggestionEnabled, setSuggestionEnabled] = useState(true)
    const [enhanceEnabled, setEnhanceEnabled] = useState(true)
    const [featuresLoading, setFeaturesLoading] = useState(true)

    // Load saved key status and feature flags on mount
    useEffect(() => {
        chrome.storage.local.get(['geminiApiKey', 'suggestionEnabled', 'enhanceEnabled'], (result) => {
            if (result.geminiApiKey) {
                setStatus('saved')
            } else {
                setStatus('empty')
            }
            // Default to true if flag not yet set
            setSuggestionEnabled(result.suggestionEnabled !== false)
            setEnhanceEnabled(result.enhanceEnabled !== false)
            setFeaturesLoading(false)
        })
    }, [])

    const handleSave = async () => {
        const trimmed = apiKey.trim()
        if (!trimmed) return

        await chrome.storage.local.set({ geminiApiKey: trimmed })
        setStatus('saved')
        setApiKey('') // clear input after save
    }

    const handleClear = async () => {
        await chrome.storage.local.remove('geminiApiKey')
        setStatus('empty')
        setApiKey('')
    }

    const handleSuggestionToggle = async (checked: boolean) => {
        setSuggestionEnabled(checked)
        await chrome.storage.local.set({ suggestionEnabled: checked })
    }

    const handleEnhanceToggle = async (checked: boolean) => {
        setEnhanceEnabled(checked)
        await chrome.storage.local.set({ enhanceEnabled: checked })
    }

    return (
        <div className="min-h-screen flex items-start justify-center pt-16 px-4">
            <div className="w-full max-w-lg space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">PromptVite Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure your AI-powered prompt enhancement.
                    </p>
                </div>

                {/* API Key Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Gemini API Key
                            <StatusBadge status={status} />
                        </CardTitle>
                        <CardDescription>
                            Your API key is stored locally on this device and is never sent anywhere except Google's Gemini API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-key-input">API Key</Label>
                            <Input
                                id="api-key-input"
                                type="password"
                                placeholder={status === 'saved' ? '••••••••••••••••' : 'Paste your Gemini API key'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave()
                                }}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={!apiKey.trim()}
                            >
                                Save Key
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleClear}
                                disabled={status !== 'saved'}
                            >
                                Clear Key
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Don't have a key?{' '}
                            <a
                                href="https://aistudio.google.com/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 hover:text-foreground transition-colors"
                            >
                                Get your free Gemini API key →
                            </a>
                        </p>
                    </CardContent>
                </Card>

                {/* Features Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                        <CardDescription>
                            Enable or disable individual PromptVite features on ChatGPT.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Suggestion Feature */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="suggestion-toggle" className="text-sm font-medium">
                                    Prompt Suggestions
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Show saved-prompt dropdown when you type <code className="bg-muted px-1 rounded">#keyword</code>
                                </p>
                            </div>
                            <Switch
                                className='cursor-pointer'
                                id="suggestion-toggle"
                                checked={suggestionEnabled}
                                onCheckedChange={handleSuggestionToggle}
                                disabled={featuresLoading}
                            />
                        </div>

                        <div className="border-t" />

                        {/* Enhance / Pencil Feature */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="enhance-toggle" className="text-sm font-medium">
                                    Prompt Improver Button
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Show the ✏️ pencil button to AI-enhance your prompt before sending
                                </p>
                            </div>
                            <Switch
                                className='cursor-pointer'
                                id="enhance-toggle"
                                checked={enhanceEnabled}
                                onCheckedChange={handleEnhanceToggle}
                                disabled={featuresLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: KeyStatus }) {
    if (status === 'loading') {
        return (
            <span className="text-xs font-normal text-muted-foreground">
                Loading...
            </span>
        )
    }

    if (status === 'saved') {
        return (
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-500/15 text-green-500">
                🟢 Key saved
            </span>
        )
    }

    return (
        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">
            🔴 No key set
        </span>
    )
}
