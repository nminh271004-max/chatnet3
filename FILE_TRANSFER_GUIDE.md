# ChatNET - Hướng dẫn gửi ảnh và file

## ✨ Tính năng mới

ChatNET giờ đây hỗ trợ gửi ảnh và file qua mạng local (LAN).

### Các tính năng được thêm vào:

1. **📷 Gửi ảnh**: Chọn và gửi ảnh từ thư viện điện thoại
2. **📎 Gửi file**: Gửi các file có hỗ trợ (ảnh với định dạng hiển thị)
3. **🔐 Mã hóa file**: File sẽ được mã hóa nếu chế độ mã hóa đã bật
4. **📊 Hiển thị kích thước**: Xem kích thước file được gửi

## 🚀 Cách sử dụng

### Gửi ảnh

1. Mở ChatNET trên thiết bị của bạn
2. Nhấn nút **📷** (camera icon) ở góc trái của thanh nhập liệu
3. Chọn ảnh từ thư viện của bạn
4. Ảnh sẽ được gửi tự động đến người nhận

### Hiển thị ảnh nhận được

- Khi bạn nhận được ảnh từ người khác, ảnh sẽ được hiển thị trực tiếp trong tin nhắn
- Bạn có thể thấy tên file và kích thước của file
- Ảnh được hiển thị với chất lượng tốt

## ⚙️ Cài đặt

### Android

1. Cấp quyền truy cập thư viện:
   - Ứng dụng sẽ tự động xin cấp quyền truy cập photos
   - Chọn "Allow" khi được hỏi

### iOS

1. Thêm quyền vào `Info.plist`:
   ```xml
   <key>NSPhotoLibraryUsageDescription</key>
   <string>ChatNET cần quyền truy cập thư viện ảnh để gửi ảnh</string>
   ```

## 📋 Chi tiết kỹ thuật

### Hạn chế kích thước file

- Kích thước tối đa: **10MB** trên mỗi file
- Định dạng hỗ trợ: JPEG, PNG, GIF, WebP, v.v.

### Giao thức truyền file

File được gửi dưới dạng JSON với cấu trúc:
```json
{
  "type": "FILE",
  "data": {
    "fileName": "photo.jpg",
    "fileSize": 1024000,
    "fileContent": "base64_encoded_content",
    "mimeType": "image/jpeg",
    "type": "image"
  },
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

### Mã hóa

Nếu chế độ mã hóa được bật:
1. File JSON được mã hóa bằng DES
2. Cả hai thiết bị phải sử dụng **cùng một DES Key**
3. File sẽ được giải mã tự động khi nhận

## 🐛 Khắc phục sự cố

### Ảnh không gửi được

**Vấn đề**: Kết nối bị từ chối hoặc timeout
- ✅ Kiểm tra IP đã nhập đúng chưa
- ✅ Đảm bảo cả 2 thiết bị trên cùng WiFi
- ✅ Kiểm tra ứng dụng đã mở ở thiết bị kia chưa

### File quá lớn

**Vấn đề**: "File quá lớn"
- ✅ Kích thước file tối đa là 10MB
- ✅ Nén ảnh trước khi gửi nếu cần

### Ảnh không hiển thị

**Vấn đề**: Nhận ảnh nhưng không hiển thị
- ✅ Kiểm tra chế độ mã hóa: cả 2 người phải dùng cùng key
- ✅ Thử gửi lại

## 📝 Các file được sửa đổi

1. **`App.tsx`**
   - Thêm hàm `pickImage()` - chọn ảnh từ thư viện
   - Thêm hàm `sendFile()` - gửi file qua mạng
   - Cập nhật `Message` interface để hỗ trợ file
   - Cập nhật server handler để xử lý file messages
   - Thêm UI components cho file/ảnh
   - Thêm button 📷 để gửi ảnh

2. **`src/utils/fileHandler.ts`** (Tạo mới)
   - `FileData` interface
   - Hàm kiểm tra kích thước file
   - Hàm định dạng kích thước hiển thị
   - Hàm tạo/phân tích file message protocol

## 💡 Ví dụ sử dụng

```typescript
// Gửi ảnh
const pickImage = async () => {
  launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
  }, (response) => {
    if (response.assets?.[0]) {
      const fileData: FileData = {
        fileName: response.assets[0].fileName || 'photo.jpg',
        fileSize: response.assets[0].fileSize || 0,
        fileContent: response.assets[0].base64 || '',
        mimeType: response.assets[0].type || 'image/jpeg',
        type: 'image',
      };
      sendFile(fileData);
    }
  });
};
```

## 🎯 Tính năng sắp tới

- ✨ Gửi video
- ✨ Gửi tài liệu (PDF, Word, v.v.)
- ✨ Lưu file nhận được vào thư viện
- ✨ Tải lại/Retransmit file nếu lỗi

---

**Phiên bản**: 1.0.0  
**Cập nhật**: 30/11/2025
