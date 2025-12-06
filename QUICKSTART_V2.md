# ChatNET v2.0 - Quick Start Guide

## Tóm Tắt Cập Nhật

Ứng dụng ChatNET đã được nâng cấp với:
- ✅ **Fix lỗi gửi ảnh** (Large files không bị corrupt)
- ✅ **AES-256 mã hóa** (thay DES)
- ✅ **Username** (hiển thị tên người dùng)
- ✅ **Tự huỷ tin nhắn** (Auto-delete 5-60s)
- ✅ **Chặn chụp màn hình** (Guide có sẵn)

---

## Chuẩn Bị (5 phút)

### Điều kiện tiên quyết
- 2 thiết bị/emulator Android hoặc iOS
- Cùng mạng WiFi (hoặc device + PC trên LAN)
- Node.js + React Native CLI cài sẵn

### Cài đặt Dependencies
```bash
cd /home/minh/Chatnet3/PJ
npm install
```

---

## Chạy App (10 phút)

### Bước 1: Mở Terminal 1 - Metro Server
```bash
cd /home/minh/Chatnet3/PJ
npx react-native start
```
Chờ "Welcome to Metro Bundler..." xuất hiện, không đóng terminal.

### Bước 2: Mở Terminal 2 - Build & Run

#### Android (Device hoặc Emulator)
```bash
npx react-native run-android
```
App sẽ tự build, install, và mở trên device.

#### iOS (macOS only)
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## Cài Đặt Ban Đầu (2 phút)

### Device A:
1. **Mở Settings** (⚙️ icon top right)
2. Ghi lại **"Địa chỉ IP của bạn"** (vd: `192.168.1.5`)
3. **Tên người dùng** → Nhập tên (vd: `Alice`)
4. **Auto-delete** → Chọn `10s` (thử)
5. **Encryption** → ON, Key = `ChatNET1`
6. Tap **"✓ Lưu cài đặt"**

### Device B:
1. **Settings**
2. **IP người nhận** → Paste IP từ Device A
3. **Tên người dùng** → `Bob`
4. **Auto-delete** → `5s`
5. **Encryption** → ON, Key = `ChatNET1` (PHẢI GIỐNG!)
6. **Save**

---

## Test Chức Năng (5 phút)

### Test 1: Tin Nhắn Text

**Device A**:
```
Nhập: "Hello Bob! 👋"
Tap: Send (icon arrow)
```

**Device B**:
```
✅ Nhận được "Hello Bob! 👋"
✅ Hiển thị: "Alice" (username)
✅ Icon: 🔒 (encrypted) ⏲️ (auto-delete)
```

🕐 Chờ 5 giây:
```
❌ Tin nhắn biến mất tự động!
```

### Test 2: Gửi Ảnh

**Device A**:
```
1. Tap: 📷 (camera icon)
2. Select image từ thư viện
3. Progress bar: 0% → 100%
4. ✅ Ảnh hiện trên A với username
```

**Device B**:
```
✅ Ảnh nhận được sau 3-10s (tuỳ size)
✅ Ảnh hiển thị ĐÚNG (không pixelated/corrupt)
✅ Có username + tự huỷ countdown
```

### Test 3: Gửi Ảnh Lớn (2MB+)

**Phát hiện**: Progress chậm → Ảnh vẫn đúng (framing works!)

---

## Test Encryption

### Mismatch Key
1. **Device A** → Change Key to `"WrongKey123"`
2. **Send message**
3. **Device B** → See ⚠️ "Lỗi file" (expected!)
4. **Fix**: Device A → Key back to `ChatNET1` → Works!

---

## Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|----------|
| "Không thể kết nối đến IP" | Sai IP / Devices không cùng WiFi | Kiểm tra IP, restart WiFi |
| Ảnh bị pixelated/cut | (OLD BUG - FIXED!) | Cập nhật app; test lại |
| Message không gửi | Encryption key mismatch | Kiểm tra key giống nhau? |
| Auto-delete không hoạt động | Setting = "Tắt" (0s) | Chọn 5s hoặc cao hơn |
| Screenshot blocking | Need native module | See `SCREENSHOT_BLOCKING_GUIDE.md` |

---

## File Quan Trọng

| File | Mục đích |
|------|---------|
| `App.tsx` | Main UI + networking logic (NEW: framing, metadata) |
| `src/utils/desEncryption.ts` | AES-256 encryption (NEW: replaced DES) |
| `src/utils/fileHandler.ts` | File validation (NEW: better base64 check) |
| `IMPLEMENTATION_SUMMARY.md` | Đầy đủ changelog + testing checklist |
| `SCREENSHOT_BLOCKING_GUIDE.md` | Hướng dẫn chặn screenshot |

---

## Lệnh Debug

```bash
# View logs
npx react-native log-android
npx react-native log-ios

# Clear Metro cache
rm -rf /tmp/metro-*

# Rebuild
npx react-native start --reset-cache

# Test encryption locally (Node.js)
node -e "const {encryptDES, decryptDES} = require('./src/utils/desEncryption.ts'); console.log(encryptDES('test', 'ChatNET1'))"
```

---

## Performance Tips

- 🔥 **First run slow**: Metro bundling normal (1-2 min)
- 📱 **Keep devices close**: WiFi signal ≥ -50 dBm
- 🖼️ **Large images**: Compress to 2-3MB max (base64 = 3-4MB)
- 🔄 **Restart if crash**: `Ctrl+C` Metro → `npx react-native start`

---

## Thế Nào Tiếp Theo?

1. ✅ **Test** trên 2 device real
2. 🎨 **Tuỳ chỉnh** UI (colors, fonts)
3. 🚀 **Deploy** (APK, IPA build)
4. 🔒 **Implement screenshot blocking** (nếu cần)
5. 💾 **Add file save** (download ảnh)

---

## Support

Nếu có vấn đề:
1. Check `IMPLEMENTATION_SUMMARY.md` → Testing Checklist
2. Check `SCREENSHOT_BLOCKING_GUIDE.md` (screenshot issues)
3. Review error message trong Metro console
4. Clear cache: `npm start --reset-cache`

---

**Good luck! 🚀 Enjoy ChatNET v2.0**
