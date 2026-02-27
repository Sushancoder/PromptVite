import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type KeyStatus = 'loading' | 'saved' | 'empty'

export default function App() {
    const [apiKey, setApiKey] = useState('')
    const [status, setStatus] = useState<KeyStatus>('loading')

    // Load saved key status on mount
    useEffect(() => {
        chrome.storage.local.get('geminiApiKey', (result) => {
            if (result.geminiApiKey) {
                setStatus('saved')
            } else {
                setStatus('empty')
            }
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
