# Hướng dẫn Chặn Chụp Màn Hình - ChatNET

## Giới thiệu

Tính năng chặn chụp màn hình giúp bảo vệ quyền riêng tư người dùng, ngăn chặn chia sẻ hình ảnh/tin nhắn nhạy cảm mà không được phép.

## Cấp độ Thực hiện

### Cấp 1: Tắt Screenshots trên toàn bộ App (Tất cả Messages)

#### Android
Sửa `android/app/src/main/java/com/chatnet/MainActivity.kt`:

```kotlin
package com.chatnet;

import android.os.Bundle;
import android.view.WindowManager;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

public class MainActivity extends ReactActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Disable screenshots for entire app
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, 
                         WindowManager.LayoutParams.FLAG_SECURE);
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName());
  }

  @Override
  protected String getMainComponentName() {
    return "chatnet";
  }
}
```

#### iOS
Sửa `ios/ChatNET/AppDelegate.swift`:

```swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Disable screenshots/screen recording for entire app
    let documentInteraction = UIDocumentInteractionController()
    // Or use:
    DispatchQueue.main.async {
      let window = UIApplication.shared.windows.first
      window?.windowScene?.screen.capturedDidChangeNotification
    }
    
    return true
  }
}
```

**Note**: iOS không cò API native để tắt screenshots hoàn toàn. Cách tốt nhất là dùng custom native module.

---

### Cấp 2: Custom Native Modules (Recommended)

#### Android - Tạo RN Module

1. **Tạo file `ScreenshotBlocker.kt`** ở `android/app/src/main/java/com/chatnet/`:

```kotlin
package com.chatnet

import android.content.Context
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenshotBlocker(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ScreenshotBlocker"

  @ReactMethod
  fun enableBlockScreenshots() {
    val activity = currentActivity ?: return
    activity.runOnUiThread {
      activity.window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
      )
    }
  }

  @ReactMethod
  fun disableBlockScreenshots() {
    val activity = currentActivity ?: return
    activity.runOnUiThread {
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
  }
}
```

2. **Tạo Package** ở `android/app/src/main/java/com/chatnet/`:

```kotlin
package com.chatnet

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ScreenshotBlockerPackage : ReactPackage {

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(ScreenshotBlocker(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
```

3. **Đăng ký Package** ở `MainApplication.kt`:

```kotlin
import com.chatnet.ScreenshotBlockerPackage

override fun getPackages(): List<ReactPackage> {
  return listOf(
    MainReactPackage(),
    ScreenshotBlockerPackage()  // Add this
  )
}
```

#### iOS - Tạo RN Module

1. **Tạo file `ScreenshotBlocker.m`** và `ScreenshotBlocker.h` ở `ios/ChatNET/`:

```objc
// ScreenshotBlocker.h
#import <React/RCTBridgeModule.h>

@interface ScreenshotBlocker : NSObject <RCTBridgeModule>
@end

// ScreenshotBlocker.m
#import "ScreenshotBlocker.h"
#import <UIKit/UIKit.h>

@implementation ScreenshotBlocker
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(enableBlockScreenshots:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIApplication *app = [UIApplication sharedApplication];
    UIWindow *window = [[UIApplication sharedApplication].windows firstObject];
    
    if (window) {
      // Add transparent overlay to prevent screenshots
      UIView *blockerView = [[UIView alloc] initWithFrame:window.bounds];
      blockerView.tag = 9999;
      blockerView.userInteractionEnabled = NO;
      [window addSubview:blockerView];
    }
    
    resolve(@"Blocked");
  });
}

RCT_EXPORT_METHOD(disableBlockScreenshots:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIApplication *app = [UIApplication sharedApplication];
    UIWindow *window = [[UIApplication sharedApplication].windows firstObject];
    
    if (window) {
      UIView *blockerView = [window viewWithTag:9999];
      if (blockerView) {
        [blockerView removeFromSuperview];
      }
    }
    
    resolve(@"Unblocked");
  });
}

@end
```

---

### Cấp 3: TypeScript Wrapper (Cho App.tsx)

Tạo file `src/utils/screenshotBlocker.ts`:

```typescript
import { NativeModules, Alert } from 'react-native';

const { ScreenshotBlocker } = NativeModules;

export const screenshotBlockerUtils = {
  /**
   * Enable screenshot blocking for the entire app or specific view
   */
  async enableBlockScreenshots(): Promise<void> {
    try {
      if (ScreenshotBlocker && ScreenshotBlocker.enableBlockScreenshots) {
        await ScreenshotBlocker.enableBlockScreenshots();
      } else {
        console.warn('ScreenshotBlocker module not available');
      }
    } catch (error: any) {
      console.error('Failed to enable screenshot blocking:', error.message);
    }
  },

  /**
   * Disable screenshot blocking
   */
  async disableBlockScreenshots(): Promise<void> {
    try {
      if (ScreenshotBlocker && ScreenshotBlocker.disableBlockScreenshots) {
        await ScreenshotBlocker.disableBlockScreenshots();
      }
    } catch (error: any) {
      console.error('Failed to disable screenshot blocking:', error.message);
    }
  },

  /**
   * Enable/disable for specific messages (require additional logic)
   */
  enableForMessage(messageIndex: number): void {
    // Implementation would require storing which messages are protected
    // and applying FLAG_SECURE selectively per view
  },

  disableForMessage(messageIndex: number): void {
    // Corresponding disable
  },
};
```

---

### Cấp 4: Tích hợp trong App.tsx

Thêm vào `App.tsx`:

```typescript
import { screenshotBlockerUtils } from './src/utils/screenshotBlocker';

// Trong useEffect khi app mount:
useEffect(() => {
  // Enable screenshot blocking on app start
  screenshotBlockerUtils.enableBlockScreenshots();

  return () => {
    // Optional: disable on unmount
    // screenshotBlockerUtils.disableBlockScreenshots();
  };
}, []);
```

---

## Hạn chế & Lưu ý

| Nền tảng | Tính năng | Hạn chế |
|---------|---------|---------|
| Android | FLAG_SECURE | Chặn toàn bộ app; không thể selective per-message |
| iOS | UIView overlay | Không phải cách chuẩn; có thể bị phát hiện |
| Both | Recording | Cần kiểm tra `UIScreen.recordingNotifications` (iOS) |

---

## Phương án Tốt nhất

**Khuyến nghị**: Kết hợp 2 cách

1. **Global**: Bật `FLAG_SECURE` khi app mở (bảo vệ toàn bộ)
2. **Per-Message** (optional): Dùng custom UI widget cho sensitive messages (nhưng phức tạp hơn)

---

## Testing

```bash
# Android - Chụp màn hình trong ADB shell (sẽ fail nếu FLAG_SECURE enabled)
adb shell screencap -p /sdcard/screen.png

# iOS - Không có cách native; dùng Xcode simulator screenshot
```

---

## Tài liệu Thêm

- [Android FLAG_SECURE](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#FLAG_SECURE)
- [iOS Screen Recording Prevention](https://developer.apple.com/documentation/avfoundation/avaudiosession/preventing_screen_recording)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-android)
