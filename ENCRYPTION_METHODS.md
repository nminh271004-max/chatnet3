## ChatNET Encryption Method Selector

### Overview
App giờ hỗ trợ 3 phương pháp mã hóa khác nhau, người dùng có thể chọn trong Settings.

### Encryption Methods

#### 1. 🔒 AES-256 (DEFAULT - RECOMMENDED)
- **Status**: ✅ Sản xuất (Production Ready)
- **Security**: Rất cao (256-bit key)
- **Mode**: CBC (Cipher Block Chaining)
- **Key Derivation**: SHA-256
- **Use Case**: Mọi tình huống sản xuất
- **Performance**: Nhanh, an toàn
- **Notes**: Sử dụng random IV cho mỗi tin nhắn

#### 2. 🔐 DES (LEGACY)
- **Status**: ⚠️ Không khuyến nghị
- **Security**: Yếu (64-bit key)
- **Mode**: ECB (Electronic CodeBook)
- **Key**: 8 bytes (system tự pad nếu < 8 chars)
- **Use Case**: Giáo dục, bài tập lịch sử
- **Performance**: Nhanh
- **Warning**: DES đã bị deprecated vì bảo mật yếu

#### 3. 📜 Caesar (EDUCATIONAL)
- **Status**: 🎓 Chỉ học tập
- **Security**: Rất yếu
- **Mechanism**: Dịch chuyển ký tự
- **Shift Range**: 1-25
- **Use Case**: Học lập trình, cryptography 101
- **Performance**: Rất nhanh
- **Limitation**: Không bảo vệ dữ liệu thực tế

### How to Use

#### 1. Access Encryption Settings
```
Main Screen → ⚙️ Cài đặt (Settings)
     ↓
🔐 Chế độ mã hóa (toggle ON)
     ↓
🔐 Phương pháp mã hóa (method selector appears)
```

#### 2. Select Encryption Method
```
[ 🔒 AES-256 ] [ 🔐 DES ] [ 📜 Caesar ]
```
- Tap một button để chọn
- Button sẽ chuyển sang xanh (green) khi được chọn

#### 3. Configure Method-Specific Settings

**For AES-256 & DES:**
- Nhập Key (1-16 ký tự)
- Cả 2 người phải dùng cùng key

**For Caesar Cipher:**
- Nhập Shift (1-25)
- Cả 2 người phải dùng cùng shift
- Shift field chỉ xuất hiện khi chọn Caesar method

### Implementation Details

#### File Changes
- `App.tsx`: Main implementation with UI menu
- `src/utils/aesEncryption.ts`: AES-256 functions
- `src/utils/desEncryption.ts`: DES functions
- `src/utils/caesarCipher.ts`: Caesar cipher functions

#### New State Variables
```typescript
const [encryptionMethod, setEncryptionMethod] = useState<'AES' | 'DES' | 'Caesar'>('AES');
const [caesarShift, setCaesarShift] = useState<number>(3);
```

#### New Helper Functions
```typescript
// Encrypt message with selected method
const encryptMessage = (text, method, key, caesarShift?): string

// Decrypt message with selected method
const decryptMessage = (encryptedText, method, key, caesarShift?): string

// Validate encryption key by method
const isValidEncryptionKey = (key, method): boolean
```

#### Message Flow
```
Sender:
  User input → Select method → encryptMessage() → TCP send → Display

Receiver:
  TCP receive → decryptMessage() → Parse → Display
```

### Security Notes

#### ✅ SECURE (Use for real data)
- AES-256 with random IV per message
- Each message encrypted independently
- Key is hashed before use

#### ⚠️ INSECURE (Educational only)
- DES has weak 64-bit key space (brute-forceable)
- Caesar cipher has trivial 26 possibilities
- No authentication (HMAC not implemented)

### Future Improvements
- [ ] Add 3DES (Triple DES) for backward compatibility
- [ ] Implement HMAC authentication
- [ ] Add PBKDF2 for stronger key derivation
- [ ] Support for AES with other modes (GCM, CTR)
- [ ] TLS/SSL transport layer encryption

### Testing

#### Test Files
- `test/aes.test.js`: 6 tests (all passing ✅)
- `test/des.test.js`: 9 tests (all passing ✅)
- `test/caesar.test.js`: 11 tests (all passing ✅)

#### Run Tests
```bash
cd /home/minh/Chatnet3/PJ
node test/aes.test.js
node test/des.test.js
node test/caesar.test.js
```

### Troubleshooting

**Q: Messages không thể giải mã?**
A: Kiểm tra:
1. Cả 2 người dùng cùng encryption method
2. Cùng key (AES/DES)
3. Cùng shift (Caesar)

**Q: Caesar method bị mạnh mẽ/yếu?**
A: Caesar là demo giáo dục. Dùng AES-256 cho dữ liệu thực.

**Q: Có thể thay đổi method giữa chat?**
A: Có, nhưng cần báo cho bên kia. Tin nhắn cũ sẽ giải mã sai.

**Q: DES an toàn không?**
A: Không. Chỉ dùng cho học tập. AES-256 được khuyến nghị.

### Version
- Feature added: v0.5.0
- Last updated: January 18, 2026
