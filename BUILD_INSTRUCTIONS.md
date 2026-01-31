# Building the Camera App

This app uses `react-native-vision-camera` which requires a development build (can't use Expo Go).

## Option 1: Build with EAS (Recommended)

### For iOS Simulator (Testing on Mac):
```bash
eas build --profile development --platform ios
```

### For iOS Device (TestFlight):
```bash
eas build --profile preview --platform ios
```

After the build completes:
1. Download the build from the EAS dashboard
2. For simulator: Drag the .app file to your simulator
3. For device: Install via TestFlight

## Option 2: Local Development Build

If you have a Mac with Xcode installed:

```bash
# Generate native iOS project
npx expo prebuild --clean

# Open in Xcode
open ios/*.xcworkspace

# Build and run from Xcode
```

## What Changed

- **Switched from expo-camera to react-native-vision-camera**
  - Better camera quality control
  - Direct access to physical camera lenses
  - Full resolution photo capture without preview scaling
  - Professional-grade camera features

## Features

- Explicit selection of back camera lenses:
  - Ultra Wide (0.5x)
  - Wide (1x)
  - Telephoto (2-3x)
- Full resolution photo capture
- Automatic save to camera roll
- Native iOS camera quality matching stock Camera app

## Next Steps

1. Run `eas build --profile development --platform ios` to create a development build
2. Install the build on your device or simulator
3. Test the camera and verify photo quality matches the stock Camera app
