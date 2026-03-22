# MU (Memory Unlock)

Condition-based memory resurfacing camera app built with Expo React Native and Expo Dev Client.

## MVP implemented

- Custom camera screen with front/back switch
- Capture photo and preview flow
- Save memory with metadata:
  - timestamp (`createdAt`)
  - GPS location (`latitude`, `longitude`)
  - resurface delay days
- Local persistence with Zustand + AsyncStorage
- Local image storage in app document directory
- Foreground memory trigger monitor:
  - time trigger (after X days)
  - location trigger (revisit within ~80m)
- Emotional resurfacing modal (Memory Unlocked)

## Folder structure

- `features/camera`
- `features/memory`
- `features/location`
- `components`
- `store`
- `utils`

## Prerequisites

- Node.js 20+
- Xcode (for iOS local build)
- Android Studio (for Android local build)
- iPhone device and same local network

## Install

```bash
npm install
```

## Expo Dev Client setup

```bash
npx expo prebuild
npx expo run:ios
```

- This creates and installs a custom dev client on simulator/device.
- For real iPhone testing, connect iPhone and run from Xcode once, then:

```bash
npm run start
```

- Scan QR from the installed dev client app.
- Fast Refresh works with `expo start --dev-client`.

## iOS Run Guide (Recommended)

Follow this flow for stable iOS development with Expo Dev Client.

### 1) First-time setup

```bash
cd /Users/iseonghyo/Desktop/meUDev
npm install
npx expo prebuild
```

### 2) Build and install iOS Dev Client

Simulator:

```bash
npm run ios
```

Real iPhone (first build):

1. Connect iPhone to Mac with cable.
2. Open `ios/MU.xcworkspace` in Xcode.
3. Select your Team in Signing & Capabilities.
4. Use a unique Bundle Identifier if needed.
5. Choose your iPhone as target and press Run.

After first successful install, you can usually continue from CLI:

```bash
npm run ios -- --device
```

### 3) Start Metro server for Dev Client

```bash
npm run start
```

Then open the installed Dev Client app on iPhone and connect via QR or local network.

### 4) Daily development loop

1. Run `npm run start`
2. Open Dev Client app on iPhone
3. Edit code and use Fast Refresh

### 5) When native config changes

If you add/remove native modules or change native plugin settings:

```bash
npx expo prebuild
npm run ios
```

## iOS Troubleshooting

- Signing error in Xcode:
  - Set Team and Bundle Identifier again.
- Device not detected:
  - Unlock phone, trust computer, reconnect cable.
- Dev Client cannot load bundle:
  - Ensure Mac and iPhone are on same network.
  - Restart Metro with `npm run start -- --clear`.
- Build cache issues:
  - Clean build folder in Xcode and rebuild.

## Run

```bash
npm run start
```

## Auto commit (Conventional Commits)

```bash
npm run commit:auto -- feat react-native add camera UX polish
```

- Format: `<type>(<scope>): <description>`
- Example scope: `react-native`, `ios`, `android`, `camera`, `memory`

Quick checkpoint commit:

```bash
npm run commit:checkpoint
```

## Notes

- This project intentionally focuses on MVP flow:
  `capture -> save with conditions -> automatic resurface`.
- The monitor runs while the app is active/foreground.
- Next step for production: background task + push notifications.