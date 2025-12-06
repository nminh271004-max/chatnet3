# 📸 ChatNET - Hệ thống gửi ảnh và file

## 📋 Tóm tắt thay đổi

### ✨ Tính năng được thêm vào:

1. **📷 Gửi ảnh qua LAN** - Chọn và gửi ảnh từ thư viện điện thoại
2. **🔐 Mã hóa file** - File được mã hóa DES tự động nếu cần
3. **📊 Hiển thị ảnh** - Ảnh được hiển thị trực tiếp trong chat
4. **📁 Thông tin file** - Xem tên file và kích thước
5. **⏳ Loading state** - Indicator khi đang gửi file

---

## 📁 Cấu trúc file thay đổi

### File mới tạo:

```
src/utils/
  └── fileHandler.ts (Mới) - Xử lý file utilities
```

### File được sửa đổi:

```
App.tsx (Chính) - Thêm UI, logic gửi/nhận ảnh
```

### Tài liệu tham khảo:

```
FILE_TRANSFER_GUIDE.md      - Hướng dẫn chi tiết sử dụng
PERMISSIONS_GUIDE.md        - Cấu hình permissions
QUICKSTART.md              - Bắt đầu nhanh
CHANGES.md                 - Chi tiết thay đổi
EXTEND_FILE_FEATURES.ts    - Ví dụ mở rộng tính năng
```

---

## 🎯 Cách sử dụng nhanh

### 1️⃣ Cài đặt dependencies
```bash
npm install
```

### 2️⃣ Build & chạy
```bash
# Android
npm run build:apk
npm run install:apk
npm start

# iOS
npm run ios
```

### 3️⃣ Sử dụng tính năng
- Mở app trên 2 thiết bị
- Thiết bị A: ⚙️ → Ghi lại IP → ✓ Lưu
- Thiết bị B: ⚙️ → Nhập IP → ✓ Lưu
- Nhấn 📷 để gửi ảnh

---

## 🔧 Các thành phần chính

### 1. **fileHandler.ts** - Xử lý file

```typescript
interface FileData {
  fileName: string;
  fileSize: number;
  fileContent: string;    // base64 encoded
  mimeType: string;
  type: 'image' | 'file';
}

fileHandler.validateFileSize(size)        // Kiểm tra kích thước
fileHandler.formatFileSize(bytes)         // Format hiển thị
fileHandler.createFileMessage(fileData)   // Tạo file message
fileHandler.parseFileMessage(message)     // Phân tích message
```

### 2. **App.tsx - Các hàm mới**

```typescript
pickImage()          // Chọn ảnh từ thư viện
sendFile(fileData)   // Gửi file qua TCP
```

### 3. **UI Components mới**

```
📷 Button - Chọn ảnh
📎 File info - Hiển thị thông tin file
🖼️ Image preview - Hiển thị ảnh nhận được
⏳ Loading indicator - Khi đang gửi
```

---

## 📊 Giao thức truyền dữ liệu

### Format file message:

```json
{
  "type": "FILE",
  "data": {
    "fileName": "photo.jpg",
    "fileSize": 1024000,
    "fileContent": "base64_encoded_string",
    "mimeType": "image/jpeg",
    "type": "image"
  },
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

### Khi mã hóa bật:
- Cả JSON được mã hóa DES
- Giải mã tự động khi nhận
- Cần cùng DES Key

---

## ⚙️ Cấu hình

### Permissions

**Android** (`AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.INTERNET" />
```

**iOS** (`Info.plist`):
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>ChatNET cần truy cập ảnh</string>
```

### Kích thước tối đa

File: `src/utils/fileHandler.ts` - Line 9
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## 🚀 Mở rộng tính năng

Xem file `EXTEND_FILE_FEATURES.ts` để biết cách:
- ✅ Gửi video
- ✅ Gửi tài liệu PDF
- ✅ Lưu file vào thiết bị
- ✅ Progress bar
- ✅ Retry logic
- ✅ Batch operations

---

## 📝 API Reference

### fileHandler

```typescript
// Kiểm tra kích thước file
fileHandler.validateFileSize(bytes: number): boolean

// Format kích thước hiển thị
fileHandler.formatFileSize(bytes: number): string
// "1.5 MB", "512 KB", etc.

// Lấy extension
fileHandler.getFileExtension(fileName: string): string
// "jpg", "png", etc.

// Kiểm tra là ảnh
fileHandler.isImageFile(mimeType: string): boolean

// Tạo file message
fileHandler.createFileMessage(fileData: FileData): string
// Returns JSON string

// Phân tích file message
fileHandler.parseFileMessage(message: string): FileData | null
```

### Component Props

```typescript
interface Message {
  text?: string;              // Nội dung text
  sender: 'me' | 'other';     // Người gửi
  timestamp: Date;            // Thời gian
  encrypted?: boolean;        // Đã mã hóa
  file?: FileData;           // Dữ liệu file
  isLoading?: boolean;       // Đang tải
}
```

---

## 🎨 Styles mới

```typescript
attachButton        // Nút 📷
attachButtonText    // Icon camera
fileContainer       // Chứa ảnh/file
imageMessage        // Preview ảnh
fileInfo           // Thông tin file
fileIcon           // Icon attachment
fileDetails        // Chi tiết file
fileName           // Tên file
fileSize           // Kích thước
myText / otherText // Màu text
loadingOverlay     // Loading overlay
```

---

## 🧪 Testing

### Kiểm tra cấu hình:

**Android:**
```bash
# Kiểm tra permissions
adb shell pm list permissions

# Grant permission
adb shell pm grant com.chatnet android.permission.READ_EXTERNAL_STORAGE

# Test gửi ảnh
npm run android
```

**iOS:**
```bash
# Build test
npm run ios

# Kiểm tra info.plist
open ios/ChatNET.xcworkspace
```

### Test cases:

- [ ] Gửi ảnh nhỏ (< 1MB)
- [ ] Gửi ảnh lớn (> 5MB)
- [ ] Gửi ảnh với mã hóa bật
- [ ] Gửi ảnh với mã hóa tắt
- [ ] Nhận ảnh đúng định dạng
- [ ] Hiển thị loading khi gửi
- [ ] Xử lý lỗi kết nối
- [ ] Xử lý file quá lớn

---

## 📚 Documentation Files

| File | Nội dung |
|------|---------|
| `QUICKSTART.md` | Bắt đầu nhanh 2-3 bước |
| `FILE_TRANSFER_GUIDE.md` | Hướng dẫn chi tiết |
| `PERMISSIONS_GUIDE.md` | Cấu hình permissions |
| `CHANGES.md` | Danh sách thay đổi |
| `EXTEND_FILE_FEATURES.ts` | Ví dụ mở rộng (reference) |

---

## 🆘 Support

### Lỗi phổ biến

1. **"Permission denied"**
   - Cấp quyền truy cập ảnh
   - Xem `PERMISSIONS_GUIDE.md`

2. **"File quá lớn"**
   - Max 10MB trên mỗi file
   - Nén ảnh trước khi gửi

3. **"Không thể kết nối"**
   - Kiểm tra IP có đúng
   - Đảm bảo cùng WiFi
   - Ứng dụng mở ở thiết bị kia

4. **"Ảnh không hiển thị"**
   - Kiểm tra mã hóa: cùng key
   - Thử gửi lại

---

## 📈 Performance

- Base64 encoding: +30-50% kích thước
- File 10MB → ~13-15MB khi encode
- TCP transfer có thể chậm trên mạng yếu
- Khuyên nén ảnh trước gửi

---

## 🔒 Bảo mật

- File mã hóa DES nếu bật
- Cần cùng key để giải mã
- LAN only (không internet)
- Base64 encoding (không phải encrypted storage)

---

## 🚀 Roadmap (Tính năng sắp tới)

- [ ] Gửi video
- [ ] Gửi tài liệu PDF
- [ ] Lưu file vào thiết bị
- [ ] Progress bar
- [ ] Thumbnail preview
- [ ] Batch send
- [ ] Retry failed sends
- [ ] Hỗ trợ cloud storage

---

## 📞 Thông tin

- **Phiên bản**: 1.0.0
- **Cập nhật**: 30/11/2025
- **React Native**: 0.81.4
- **Min API**: 21 (Android), 11 (iOS)

---

**🎉 Bắt đầu gửi ảnh ngay hôm nay!**

Để bắt đầu, xem `QUICKSTART.md` hoặc `FILE_TRANSFER_GUIDE.md`
