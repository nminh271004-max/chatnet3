## 🚀 Quick Start - Gửi ảnh trên ChatNET

### ✅ Bước 1: Cài đặt

```bash
# Tải dependencies
npm install

# Hoặc nếu dùng yarn
yarn install
```

### 📱 Bước 2: Build ứng dụng

**Android Debug:**
```bash
npm run build:apk
npm run install:apk
npm start
```

**Android Release:**
```bash
npm run build:release
npm run install:release
npm start
```

**iOS:**
```bash
npm run ios
# Hoặc
npm start
# Rồi chọn iOS simulator
```

### 🎯 Bước 3: Sử dụng tính năng gửi ảnh

1. **Mở app trên 2 thiết bị** (hoặc 2 emulator)

2. **Trên thiết bị A:**
   - Mở ChatNET
   - Nhấn ⚙️ (Settings)
   - Ghi lại **IP của bạn** (ví dụ: 192.168.1.100)
   - Nhấn ✓ Lưu cài đặt

3. **Trên thiết bị B:**
   - Mở ChatNET
   - Nhấn ⚙️ (Settings)
   - Nhập **IP thiết bị A** vào "IP người nhận"
   - Bật/tắt mã hóa nếu cần (cả 2 phải cùng)
   - Nhấn ✓ Lưu cài đặt

4. **Gửi ảnh:**
   - Nhấn 📷 (camera icon) ở thanh nhập liệu
   - Chọn ảnh từ thư viện
   - Ảnh được gửi tự động
   - Xem ảnh nhận được trong chat!

### 🔧 Cấu hình permissions

#### Android:
```bash
# Cấp quyền read photos (tự động khi chọn ảnh lần đầu)
# Nếu gặp lỗi, cấp manual:
adb shell pm grant com.chatnet android.permission.READ_EXTERNAL_STORAGE
```

#### iOS:
1. Vào `ios/ChatNET/Info.plist`
2. Xác nhận `NSPhotoLibraryUsageDescription` đã được thêm
3. Build lại: `npm run ios`

### ⚙️ Cấu hình tùy chọn

**Bật/tắt mã hóa:**
- ⚙️ Settings → 🔐 Chế độ mã hóa → ON/OFF
- Cả 2 người phải cùng cài đặt

**Thay đổi DES Key:**
- ⚙️ Settings → 🔑 DES Key
- Nhập key 1-16 ký tự
- Cả 2 người phải nhập **cùng key**

### 🐛 Kiểm tra sự cố

**Không nhấn được nút 📷:**
- Kiểm tra cấp quyền truy cập ảnh
- Trên Android: Settings → ChatNET → Permissions → cho phép Photos
- Trên iOS: Settings → ChatNET → Photos → All Photos

**Ảnh không gửi được:**
- ❌ Kiểm tra IP có đúng không
- ❌ Đảm bảo cả 2 thiết bị cùng WiFi
- ❌ Kiểm tra ứng dụng đã mở ở thiết bị kia chưa
- ❌ Nếu mã hóa bật: kiểm tra cả 2 dùng cùng key

**Ảnh gửi được nhưng không hiển thị:**
- Kiểm tra mã hóa: nếu bật thì cả 2 phải cùng key
- Thử gửi lại

### 📊 Thông tin kỹ thuật

- **Max file size**: 10MB
- **Protocol**: TCP socket base64 encoding
- **Encryption**: DES (optional)
- **Mạng**: LAN only (local network)

### 💡 Mẹo

1. **Để gửi ảnh nhanh:**
   - Ảnh chất lượng cao = file lớn = gửi chậm
   - Cân nhân ảnh để tối ưu kích thước

2. **Mã hóa:**
   - Bật mã hóa để bảo mật dữ liệu
   - Cả 2 người phải dùng cùng key 1-16 ký tự
   - Mặc định: "ChatNET1"

3. **IP Address:**
   - Cần từng IP nếu mạng có bảo vệ/firewall
   - IPv4 format: xxx.xxx.xxx.xxx

### 📁 File cấu hình

- `App.tsx` - Main component
- `src/utils/fileHandler.ts` - File handling utilities
- `src/utils/desEncryption.ts` - Encryption
- `PERMISSIONS_GUIDE.md` - Hướng dẫn permissions
- `FILE_TRANSFER_GUIDE.md` - Hướng dẫn chi tiết
- `EXTEND_FILE_FEATURES.ts` - Các feature mở rộng (reference)

### 🎓 Tìm hiểu thêm

- Xem `FILE_TRANSFER_GUIDE.md` để hiểu chi tiết hơn
- Xem `PERMISSIONS_GUIDE.md` để cấu hình permissions
- Xem `EXTEND_FILE_FEATURES.ts` để mở rộng tính năng

### ❓ FAQ

**Q: Có thể gửi file không phải ảnh?**
A: Hiện tại chỉ hỗ trợ ảnh. Xem `EXTEND_FILE_FEATURES.ts` để mở rộng.

**Q: Có thể gửi video?**
A: Chưa hỗ trợ. Xem `EXTEND_FILE_FEATURES.ts` để code support video.

**Q: Có thể gửi qua internet không?**
A: Hiện tại LAN only. Để support internet cần thêm server trung gian.

**Q: Ảnh có bị nén không?**
A: Có thể chọn chất lượng khi gửi (cấu hình quality = 0.8).

**Q: Có giới hạn kích thước?**
A: Tối đa 10MB trên mỗi file. Cấu hình: `src/utils/fileHandler.ts`

---

**Bắt đầu gửi ảnh ngay! 📸**
