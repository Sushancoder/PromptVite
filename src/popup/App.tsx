import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarOpen } from 'lucide-react'

export default function App() {
  const openSidebar = async () => {
    const currentWindow = await chrome.windows.getCurrent()
    if (currentWindow.id) {
      await chrome.sidePanel.open({ windowId: currentWindow.id })
    }
    window.close()
  }

  return (
    <div className="p-4 w-80">
      <Card>
        <CardHeader>
          <CardTitle>PromptVite</CardTitle>
          <CardDescription>
            Access your saved prompts in the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={openSidebar} className="w-full" size="lg">
            <SidebarOpen className="mr-2 h-4 w-4" />
            Open Sidebar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
