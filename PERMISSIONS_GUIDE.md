# 🔐 Hướng dẫn Permissions cho ChatNET

## Android Permissions

### 1. Cập nhật `android/app/src/main/AndroidManifest.xml`

Thêm các permissions sau:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.chatnet">

    <!-- Permissions cho hình ảnh -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    
    <!-- Permissions cho network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

### 2. Cập nhật `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34 // Hoặc cao hơn

    defaultConfig {
        applicationId "com.chatnet"
        minSdkVersion 21      // Minimum API level
        targetSdkVersion 34   // Target API level
        
        // Đối với read_external_storage trên Android 13+
        // Sử dụng READ_MEDIA_IMAGES thay vì READ_EXTERNAL_STORAGE
    }

    // Nếu cần, cấu hình proguard
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    // react-native-image-picker đã yêu cầu
    // không cần cài thêm gì
}
```

### 3. Request Permission Runtime (Android 6.0+)

Khi user lần đầu chọn ảnh, app sẽ tự động xin:
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_EXTERNAL_STORAGE` (Android 6.0-12)

**User thấy dialog**: "ChatNET muốn truy cập ảnh của bạn?" 
- Nhấn "Allow" để cho phép
- Nhấn "Deny" để từ chối

---

## iOS Permissions

### 1. Cập nhật `ios/ChatNET/Info.plist`

Thêm các key sau:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Các key khác -->
    
    <!-- Photo Library Permission -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>ChatNET cần truy cập thư viện ảnh để gửi ảnh cho bạn bè</string>
    
    <!-- Photo Library Add Only (iOS 11+) -->
    <key>NSPhotoLibraryAddOnlyUsageDescription</key>
    <string>ChatNET cần lưu ảnh nhận được vào thư viện</string>
    
    <!-- Camera Permission (nếu muốn chụp ảnh trực tiếp) -->
    <key>NSCameraUsageDescription</key>
    <string>ChatNET cần quyền camera để chụp ảnh</string>
    
    <!-- Network Permissions (không cần explicit) -->
    <!-- iOS 9+ được phép mặc định -->
    
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key>
        <true/>
        <key>NSBonjourServices</key>
        <array>
            <string>_tcp</string>
        </array>
    </dict>

</dict>
</plist>
```

### 2. Podfile Configuration

File `ios/Podfile` nên có:

```ruby
platform :ios, '11.0'  # Minimum iOS 11

target 'ChatNET' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false,
    :fabric_enabled => false,
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # react-native-image-picker
  pod 'react-native-image-picker', :path => '../node_modules/react-native-image-picker'

  post_install do |installer|
    # Cấu hình React Native
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
```

### 3. Build & Run

```bash
# Cài dependencies
cd ios
pod install
cd ..

# Build app
npm run ios

# Hoặc dùng Xcode
open ios/ChatNET.xcworkspace
# Nhấn Cmd+R để run
```

---

## 🔄 Permission Flow

### Android
```
User taps 📷 button
    ↓
Check if permission granted?
    ↓
NO → Show permission dialog
     User sees: "Allow ChatNET to access photos?"
     User taps: "Allow" or "Deny"
     ↓
YES → Open photo picker
      User selects image
      Image sent
```

### iOS
```
User taps 📷 button
    ↓
First time?
    ↓
YES → Show permission dialog
      User sees: "ChatNET Would Like to Access Your Photos"
      User taps: "Don't Allow" or "Allow"
      ↓
NO → Open photo picker
     User selects image
     Image sent
```

---

## 📋 Permission Reference

| Permission | Purpose | Platform | Level |
|-----------|---------|----------|-------|
| READ_EXTERNAL_STORAGE | Read photos | Android 6.0-12 | Runtime |
| READ_MEDIA_IMAGES | Read photos | Android 13+ | Runtime |
| READ_MEDIA_VIDEO | Read videos | Android 13+ | Runtime |
| INTERNET | Network access | Android | Manifest |
| NSPhotoLibraryUsageDescription | Photo library access | iOS | Info.plist |
| NSCameraUsageDescription | Camera access | iOS | Info.plist |

---

## ⚠️ Troubleshooting

### "Permission denied" trên Android

**Vấn đề**: User chọn "Deny" trong permission dialog

**Giải pháp**:
1. Mở Settings → Apps → ChatNET
2. Tập vào "Permissions"
3. Cho phép "Photos and media"
4. Quay lại app và thử lại

### "Not authorized to access Photo Library" trên iOS

**Vấn đề**: Info.plist chưa cấu hình đúng

**Giải pháp**:
1. Mở `ios/ChatNET.xcworkspace` trong Xcode
2. Chọn project "ChatNET"
3. Chọn target "ChatNET"
4. Vào "Info" tab
5. Tìm "Privacy - Photo Library Usage Description"
6. Thêm text nếu chưa có

### Ảnh không hiển thị sau khi gửi

**Vấn đề**: Permission không đủ để đọc file

**Kiểm tra**:
- ✓ Android: Vào Settings → ChatNET → Permissions → cho phép "Photos and media"
- ✓ iOS: Vào Settings → ChatNET → Photos → chọn "All Photos"

---

## 🧪 Test Permissions

### Test trên Android
```bash
# Clear permissions
adb shell pm clear-permission-whitelist com.chatnet

# Grant permission
adb shell pm grant com.chatnet android.permission.READ_EXTERNAL_STORAGE

# Run app
npm run android
```

### Test trên iOS
```bash
# Xóa app khỏi simulator
xcrun simctl erase all

# Build and run
npm run ios
```

---

## 📖 References

- [React Native Image Picker Docs](https://react-native-image-picker.dev/)
- [Android Permissions](https://developer.android.com/guide/topics/permissions/overview)
- [iOS Privacy](https://developer.apple.com/app-store/app-privacy-details/)

---

**Cập nhật lần cuối**: 30/11/2025
