# STOIC Mobile (React Native / Expo Starter)

This directory contains the production-ready mobile configuration to adapt the STOIC Clinical platform for Android and iOS devices.

## Features Adapted for Mobile
1. **Hardware-Accelerated 3D Anatomy (`AnatomyCanvasNative.tsx`)**:
   - Built on `@react-three/fiber/native` and `expo-gl`.
   - Maps touch raycasts to the 21 physical body regions (`head`, `neck`, `spine`, `chest`, `heart`, etc.).
2. **Native Multimodal File Picker (`FilePickerNative.ts`)**:
   - Implements `expo-document-picker` and `expo-file-system`.
   - Encodes PDFs, radiographic scans, and images into clean base64 data blobs for Gemini 2.5 Flash.
3. **Cross-Origin & Emulator Compatibility**:
   - The Node.js Express server (`server.ts`) includes permissive CORS handling for Android emulator (`10.0.2.2`), iOS simulator (`localhost`), and Expo development servers (`exp://*`).

## Setup & Running Mobile

```bash
# Install Expo and React Three Fiber Native dependencies
npx expo install @react-three/fiber three expo-gl expo-document-picker expo-file-system

# Start mobile preview in Expo Go
npx expo start
```
