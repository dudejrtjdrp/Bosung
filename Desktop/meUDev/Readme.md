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

## Run

```bash
npm run start
```

## Notes

- This project intentionally focuses on MVP flow:
  `capture -> save with conditions -> automatic resurface`.
- The monitor runs while the app is active/foreground.
- Next step for production: background task + push notifications.