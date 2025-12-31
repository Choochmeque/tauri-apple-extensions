# tauri-apple-extensions

[![npm](https://img.shields.io/npm/v/@choochmeque/tauri-apple-extensions.svg)](https://www.npmjs.com/package/@choochmeque/tauri-apple-extensions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Add iOS extensions to Tauri apps with a single command.

## Features

- Automatic Xcode project configuration via XcodeGen
- Plugin-based template system
- Idempotent - safe to re-run
- Share Extension support (more extension types coming soon)

## Prerequisites

- [XcodeGen](https://github.com/yonaskolb/XcodeGen) installed (`brew install xcodegen`)
- Tauri iOS project initialized (`tauri ios init`)

## Installation

```bash
npm install -D @choochmeque/tauri-apple-extensions
```

## Usage

### With a plugin (recommended)

If you're using a Tauri plugin that provides iOS extension templates:

```bash
npx @choochmeque/tauri-apple-extensions add share --plugin @choochmeque/tauri-plugin-sharekit-api
```

### With custom templates

```bash
npx @choochmeque/tauri-apple-extensions add share --templates ./path/to/templates
```

## Supported Extensions

| Type | Status | Description |
|------|--------|-------------|
| `share` | Available | Share Extension for receiving shared content |

## For Plugin Developers

To make your plugin compatible with this tool, add the following to your `package.json`:

```json
{
  "tauri-apple-extension": {
    "type": "share",
    "templates": "./ios/templates"
  }
}
```

Your templates directory should contain:
- Swift source files with `{{VARIABLE}}` placeholders
- `Info.plist` for the extension

### Template Variables

| Variable | Description |
|----------|-------------|
| `{{APP_GROUP_IDENTIFIER}}` | App Group ID (e.g., `group.com.example.app`) |
| `{{APP_URL_SCHEME}}` | URL scheme for deep linking |
| `{{VERSION}}` | App version from tauri.conf.json |
| `{{BUNDLE_IDENTIFIER}}` | Extension bundle identifier |
| `{{PRODUCT_NAME}}` | App product name |

## Post-Setup Steps

After running the tool:

1. Open the Xcode project (`src-tauri/gen/apple/*.xcodeproj`)
2. Select your Apple Developer Team for both targets
3. Enable required capabilities (e.g., App Groups) for both targets
4. Configure the capability in Apple Developer Portal

## Contributing

PRs accepted. Please make sure to read the Contributing Guide before making a pull request.

## License

MIT
