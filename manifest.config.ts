import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: "PromptVite (Autocompleter)",
  description: "Intelligent autocomplete for AI chat inputs, Prompt saving, and improvement.",
  version: pkg.version,
  icons: {
    16: 'logo.png',
    32: 'logo.png',
    48: 'logo.png',
    128: 'logo.png',
  },
  action: {
    default_icon: {
      16: 'logo.png',
      32: 'logo.png',
      48: 'logo.png',
      128: 'logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  commands: {
    "_execute_action": {  // Special Chrome command
      "suggested_key": {
        "default": "Ctrl+Shift+Y",
        "mac": "Command+Shift+Y"
      },
      "description": "Open PromptVite Popup"
    }
  },
  permissions: [
    'sidePanel',
    'storage',
    'activeTab',
    'scripting',
    'commands',
  ],
  host_permissions: [
    'https://generativelanguage.googleapis.com/*',
  ],
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://chatgpt.com/*'],
    run_at: 'document_idle',
  }],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
})