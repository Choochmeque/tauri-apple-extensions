# tauri-apple-extensions

[![npm](https://img.shields.io/npm/v/@choochmeque/tauri-apple-extensions.svg)](https://www.npmjs.com/package/@choochmeque/tauri-apple-extensions)
[![codecov](https://codecov.io/gh/Choochmeque/tauri-apple-extensions/branch/main/graph/badge.svg)](https://codecov.io/gh/Choochmeque/tauri-apple-extensions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Add iOS and macOS extensions to Tauri apps with a single command.

## Features

- Automatic Xcode project configuration via XcodeGen
- Built-in skeleton templates with TODO markers
- Plugin-based template system for custom implementations
- Supports both iOS and macOS platforms
- Idempotent - safe to re-run

## Prerequisites

- [XcodeGen](https://github.com/yonaskolb/XcodeGen) installed (`brew install xcodegen`)
- Tauri iOS project initialized (`tauri ios init`) for iOS extensions
- For macOS extensions: Tauri macOS Xcode project via [@choochmeque/tauri-macos-xcode](https://github.com/Choochmeque/tauri-macos-xcode)

## Installation

```bash
# npm
npm install -D @choochmeque/tauri-apple-extensions

# pnpm
pnpm add -D @choochmeque/tauri-apple-extensions

# yarn
yarn add -D @choochmeque/tauri-apple-extensions

# bun
bun add -D @choochmeque/tauri-apple-extensions
```

## Usage

```bash
# Add iOS Share Extension
npx @choochmeque/tauri-apple-extensions ios add share

# Add macOS Share Extension
npx @choochmeque/tauri-apple-extensions macos add share
```

This creates a Share Extension with a minimal skeleton template. Open the generated Swift file and implement your logic where you see `// TODO:` comments.

### Options

```bash
# Use templates from a plugin (plugin must include tauri-apple-extension config)
npx @choochmeque/tauri-apple-extensions ios add share --plugin <plugin-name>

# Use custom templates directory
npx @choochmeque/tauri-apple-extensions ios add share --templates ./path/to/templates
```

> **Note:** When using `--plugin`, the plugin's `package.json` must contain a `tauri-apple-extension` config. See [For Plugin Developers](#for-plugin-developers) below.

## Supported Extensions

| Type | Description |
|------|-------------|
| `share` | Share Extension for receiving shared content |

## Post-Setup Steps

After running the tool:

1. Open the Xcode project:
   - iOS: `src-tauri/gen/apple/*.xcodeproj`
   - macOS: `src-tauri/gen/apple-macos/*.xcodeproj`
2. Select your Apple Developer Team for both targets
3. Enable **App Groups** capability for both targets
4. Configure App Groups in [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/applicationGroup)

## For Plugin Developers

To make your plugin compatible, add to your `package.json`:

```json
{
  "tauri-apple-extension": {
    "type": "share",
    "templates": {
      "ios": "./templates/ios",
      "macos": "./templates/macos"
    }
  }
}
```

Plugins can support one or both platforms. If a user runs the command for a platform your plugin doesn't support, they'll receive a clear error message.

### Template Variables

| Variable | Description |
|----------|-------------|
| `{{APP_GROUP_IDENTIFIER}}` | App Group ID (e.g., `group.com.example.app`) |
| `{{APP_URL_SCHEME}}` | URL scheme for deep linking |
| `{{VERSION}}` | App version from tauri.conf.json |
| `{{BUNDLE_IDENTIFIER}}` | Extension bundle identifier |
| `{{PRODUCT_NAME}}` | App product name |

## Contributing

PRs welcome! Please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
