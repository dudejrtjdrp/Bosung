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

## Expo Dev Client 설정

```bash
npx expo prebuild
npx expo run:ios
```

- 시뮬레이터/기기에 커스텀 Dev Client를 생성하고 설치합니다.
- 실제 아이폰 테스트는 아이폰을 연결하고 Xcode에서 1회 실행 후:

```bash
npm run start
```

- 설치된 Dev Client 앱에서 QR을 스캔해 연결합니다.
- `expo start --dev-client`로 Fast Refresh를 사용할 수 있습니다.

## iOS 실행 가이드 (권장)

Expo Dev Client 기준으로 가장 안정적인 iOS 실행 순서입니다.

### 1) 최초 1회 설정

```bash
cd /Users/iseonghyo/Desktop/meUDev
npm install
npx expo prebuild
```

### 2) iOS Dev Client 빌드 및 설치

시뮬레이터:

```bash
npm run ios
```

실기기 iPhone (최초 빌드):

1. 아이폰을 Mac에 케이블로 연결합니다.
2. Xcode에서 `ios/MU.xcworkspace`를 엽니다.
3. `Signing & Capabilities`에서 Team을 선택합니다.
4. 필요하면 Bundle Identifier를 고유하게 변경합니다.
5. 타겟을 아이폰으로 선택하고 Run을 누릅니다.

최초 설치가 성공하면 이후에는 보통 CLI로 계속 진행할 수 있습니다:

```bash
npm run ios -- --device
```

### 3) Dev Client용 Metro 서버 실행

```bash
npm run start
```

아이폰에서 설치된 Dev Client 앱을 열고 QR 또는 로컬 네트워크로 연결합니다.

### 4) 일일 개발 루프

1. `npm run start` 실행
2. 아이폰에서 Dev Client 앱 열기
3. 코드 수정 후 Fast Refresh로 확인

### 5) 네이티브 설정이 바뀐 경우

네이티브 모듈 추가/삭제 또는 플러그인 설정 변경 시:

```bash
npx expo prebuild
npm run ios
```

## iOS 문제 해결

- Xcode 서명(Signing) 오류:
  - Team과 Bundle Identifier를 다시 설정합니다.
- 기기 인식 실패:
  - 아이폰 잠금 해제, 컴퓨터 신뢰 허용, 케이블 재연결을 확인합니다.
- Dev Client 번들 로드 실패:
  - Mac과 아이폰이 같은 네트워크인지 확인합니다.
  - `npm run start -- --clear`로 Metro를 재시작합니다.
- 빌드 캐시 문제:
  - Xcode에서 Clean Build Folder 후 다시 빌드합니다.

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