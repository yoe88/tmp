1. android emulator 켜기
2. npx react-native run-android

#안드로이드 APK 빌드
- android/app/src/main/assets 폴더가 있는지 확인하고 없으면 assets 폴더를 만들어 준다.
- react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
- assets 하위에 bundle 파일을 확인한다.
- 터미널에서 안드로이드 실행 (react-native run-android)
- android/app/build/outputs/apk/debug 경로에 있는 app-debug.apk 확인
