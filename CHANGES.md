# 🎉 Các thay đổi được thêm vào ChatNET

## 📦 Tóm tắt

Đã thêm chức năng **gửi ảnh và file** qua mạng LAN với hỗ trợ mã hóa DES.

## 📝 Chi tiết thay đổi

### 1. **File mới tạo**: `src/utils/fileHandler.ts`

Utility module để xử lý file:

```typescript
export interface FileData {
  fileName: string;
  fileSize: number;
  fileContent: string; // base64 encoded
  mimeType: string;
  type: 'image' | 'file';
}

export const fileHandler = {
  validateFileSize(size: number): boolean
  formatFileSize(bytes: number): string
  getFileExtension(fileName: string): string
  isImageFile(mimeType: string): boolean
  createFileMessage(fileData: FileData): string
  parseFileMessage(message: string): FileData | null
}
```

### 2. **Cập nhật**: `App.tsx`

#### Imports mới:
```typescript
import { launchImageLibrary } from 'react-native-image-picker';
import { fileHandler, FileData } from './src/utils/fileHandler';
import { ActivityIndicator } from 'react-native';
```

#### Message Interface cập nhật:
```typescript
interface Message {
  text?: string;              // Tin nhắn văn bản (optional)
  sender: 'me' | 'other';
  timestamp: Date;
  encrypted?: boolean;
  file?: FileData;            // Dữ liệu file (optional)
  isLoading?: boolean;        // Trạng thái tải
}
```

#### State mới:
```typescript
const [isSendingFile, setIsSendingFile] = useState(false);
```

#### Hàm mới:

**`pickImage()`** - Chọn ảnh từ thư viện:
- Mở thư viện ảnh
- Chuyển đổi ảnh thành base64
- Kiểm tra kích thước (max 10MB)
- Gửi ảnh qua mạng

**`sendFile(fileData)`** - Gửi file qua TCP:
- Kết nối đến IP đích
- Mã hóa file nếu cần (DES)
- Gửi file dạng JSON
- Hiển thị loading indicator
- Xử lý lỗi kết nối

#### Server handler cập nhật:
```typescript
// Phân biệt file message vs text message
const fileData = fileHandler.parseFileMessage(displayMessage);
if (fileData) {
  // Xử lý file
} else {
  // Xử lý text
}
```

#### UI Components mới:

**📷 Attach Button**:
- Button camera icon ở góc trái thanh nhập liệu
- Nhấn để chọn ảnh từ thư viện

**Hiển thị ảnh trong chat**:
```typescript
{msg.file ? (
  <View style={styles.fileContainer}>
    {msg.file.type === 'image' && (
      <Image
        source={{ uri: `data:${msg.file.mimeType};base64,...` }}
        style={styles.imageMessage}
      />
    )}
    <View style={styles.fileInfo}>
      <Text>📎 {fileName} - {fileSize}</Text>
    </View>
    {msg.isLoading && <ActivityIndicator />}
  </View>
) : (
  <Text>{msg.text}</Text>
)}
```

#### Styles mới (40+ dòng):
- `attachButton` - Nút chọn ảnh
- `attachButtonText` - Icon 📷
- `fileContainer` - Container chứa ảnh
- `imageMessage` - Hiển thị ảnh (250x250)
- `fileInfo` - Thông tin file (tên, kích thước)
- `fileIcon` - Icon attachment
- `fileDetails` - Chi tiết file
- `fileName` - Tên file
- `fileSize` - Kích thước file
- `myText` / `otherText` - Màu sắc text
- `loadingOverlay` - Loading indicator overlay
- Cập nhật `inputContainer` - Thêm `flex-end` alignment

### 3. **Hạn chế & Tính năng**

✅ **Hỗ trợ**:
- ✓ Gửi ảnh (JPEG, PNG, GIF, WebP, v.v.)
- ✓ Mã hóa file với DES Key
- ✓ Hiển thị ảnh trực tiếp trong chat
- ✓ Hiển thị kích thước file
- ✓ Loading indicator khi gửi
- ✓ Xử lý lỗi kết nối chi tiết

⚠️ **Hạn chế hiện tại**:
- Kích thước file tối đa: **10MB**
- Chỉ hỗ trợ ảnh (có thể mở rộng)
- Không lưu file vào thiết bị (chỉ hiển thị)

## 🔧 Cách sử dụng

### Gửi ảnh:
1. Nhấn button **📷** 
2. Chọn ảnh từ thư viện
3. Ảnh được gửi tự động

### Nhận ảnh:
- Ảnh được hiển thị trong chat như message thường
- Hiển thị tên file + kích thước

## 📊 Giao thức truyền dữ liệu

**Format file message**:
```json
{
  "type": "FILE",
  "data": {
    "fileName": "photo.jpg",
    "fileSize": 1024000,
    "fileContent": "base64_string_very_long...",
    "mimeType": "image/jpeg",
    "type": "image"
  },
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

**Khi mã hóa được bật**:
- Cả JSON được mã hóa DES
- Cần cùng DES Key để giải mã

## 🚀 Để kích hoạt

1. Đã cài đặt `react-native-image-picker` - ✓
2. App.tsx đã cập nhật - ✓
3. Chạy `npm install` nếu chưa - recommended
4. Build app:
   ```bash
   npm run build:apk    # Android debug
   npm run build:release # Android release
   npm run ios          # iOS
   ```

## 📚 Tài liệu thêm

- Xem `FILE_TRANSFER_GUIDE.md` để biết hướng dẫn chi tiết
- Xem `src/utils/fileHandler.ts` để biết API file handler

## ⚡ Performance Notes

- Base64 encoding ảnh: ~30-50% tăng kích thước
- File 10MB = ~13-15MB khi base64 encode
- Gửi qua TCP socket có thể chậm trên mạng yếu
- Khuyến khích nén ảnh trước khi gửi

---

**Ngày cập nhật**: 30/11/2025  
**Phiên bản**: 1.0.0
