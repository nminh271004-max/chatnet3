# 🚀 Quick Start Guide - ChatNET3

ChatNET3 là ứng dụng chat bảo mật với mã hóa end-to-end, chữ kí số, và truyền file an toàn.

## ⚡ 30 Giây Setup

### 1️⃣ Cài đặt

```bash
cd /home/minh/Chatnet3/PJ
npm install
npm start
```

### 2️⃣ Mở app trên 2 thiết bị

**Thiết bị A (Server)**:
- Settings ⚙️ → Enable Encryption
- Click "Start Server" → Port 8888

**Thiết bị B (Client)**:
- Settings ⚙️ → Enable Encryption  
- Enter IP of Device A
- Click "Connect"

### 3️⃣ Gửi tin nhắn mã hóa

```
1. Select Encryption Method: [🔒 AES] [🔐 DES] [📜 Caesar] [🔑 RSA]
2. Enter encryption key (1-32 chars)
3. Type message
4. Press Send
```

## 🔐 Encryption Methods

### 🔒 AES-256 (Recommended)

**Most secure option**
- Military-grade encryption
- Random IV per message
- SHA-256 key derivation

```
Key Example: "my_secret_key_123"
Automatic: IV generated per message
```

### 🔐 DES (Legacy)

**Educational/Historical**
- Weak 64-bit encryption
- Use for learning only
- ⚠️ NOT for sensitive data

```
Key Example: "password"
Note: Legacy cryptography
```

### 📜 Caesar (Educational)

**Simple shift cipher**
- Shift 1-25 configurator
- Perfect for learning basics
- ❌ NO security

```
Shift: 3 (A→D, B→E, etc)
Note: Letters only, numbers preserved
```

### 🔑 RSA-like (Key Exchange)

**Symmetric RSA simulation**
- HMAC-SHA256 based
- Good for educational use
- Medium security

```
Key Example: "rsa_key_pair_seed"
Note: Educational implementation
```

## 📁 Send Files

### Send PDF

```
1. Click 📎 (File icon)
2. Select PDF file
3. Auto-validates checksum
4. Sends via encrypted TCP
5. Receiver verifies integrity
```

### Supported File Types

✅ **Documents**: PDF, TXT, CSV, JSON, XML  
✅ **Office**: DOCX, XLSX, DOC, XLS  
✅ **Archives**: ZIP, RAR, 7Z  
✅ **Images**: JPEG, PNG, GIF, WebP, BMP  

❌ **Blocked**: .exe, .dll, .com (Malware protection)

## 🧪 Run Tests

```bash
# Test individual encryption methods
node test/aes.test.js          # 6 tests ✅
node test/des.test.js          # 9 tests ✅
node test/caesar.test.js       # 11 tests ✅
node test/rsa.test.js          # 9 tests ✅

# Test signatures & files
node test/digitalSignature.test.js  # 18 tests ✅
node test/fileHandler.test.js       # 28 tests ✅

# Run all tests
for test in test/*.test.js; do node "$test"; done
```

**Result**: 81/81 tests passing ✅

## ⚙️ Settings Guide

### Basic Settings

```
Username: Your name display
Encryption: ON/OFF toggle
```

### Encryption Settings

```
Method Selector: 4 buttons
├── 🔒 AES-256  (Recommended)
├── 🔐 DES      (Legacy)
├── 📜 Caesar   (Educational)
└── 🔑 RSA      (Key Exchange)
```

### AES-256 Settings

```
Encryption Key: [password_here____]
Auto: Random IV per message
Auto: SHA-256 key derivation
```

### Caesar Settings

```
Encryption Key: [key_here]
Shift Value: [    3    ]  (1-25)
Example: A→D, B→E with shift 3
```

### Connection Settings

```
Server Mode:
  - Click "Start Server"
  - Listen on Port 8888
  - Share IP to connect

Client Mode:
  - Enter Server IP
  - Click "Connect"
  - Auto-reconnect on disconnect
```

## 🔒 Security Best Practices

### ✅ DO

- ✅ Use AES-256 for production
- ✅ Use strong passwords (20+ chars)
- ✅ Keep encryption key private
- ✅ Verify received files
- ✅ Update app regularly

### ❌ DON'T

- ❌ Use Caesar for real security
- ❌ Share encryption keys
- ❌ Use same key for all conversations
- ❌ Send sensitive data over DES
- ❌ Disable file validation

## 📊 Features Overview

| Feature | Status | Tests |
|---------|--------|-------|
| AES-256 Encryption | ✅ | 6 |
| DES Encryption | ✅ | 9 |
| Caesar Cipher | ✅ | 11 |
| RSA-like Encryption | ✅ | 9 |
| Digital Signatures | ✅ | 18 |
| File Transfer | ✅ | 28 |
| Real-time Messaging | ✅ | - |
| Auto-delete Timers | ✅ | - |
| **TOTAL** | **✅** | **81** |

## 🆘 Troubleshooting

### Connection Issues

**Problem**: Can't connect to server
```
Solution:
1. Check server is running (Port 8888)
2. Verify IP address is correct
3. Check firewall allows port 8888
4. Both devices on same network
```

### Encryption Issues

**Problem**: Message shows "Invalid Key"
```
Solution:
1. Key must be 1-32 characters
2. Both sender/receiver use same key
3. Try another encryption method
```

**Problem**: File validation fails
```
Solution:
1. File size < 10MB
2. File type is supported
3. File not corrupted
4. Try another file
```

### Message Issues

**Problem**: Message received corrupted
```
Solution:
1. Check encryption method
2. Verify encryption key
3. Check network connection
4. Resend message
```

## 📱 Mobile Build

### Android Debug

```bash
npm run build:apk
npm run install:apk
npm start
```

### iOS Simulator

```bash
npm run ios
# or
npm start
# Select iOS
```

## 📚 More Information

- **Full Documentation**: See PROJECT_SUMMARY.md
- **Encryption Details**: See ENCRYPTION_METHODS.md
- **File Transfer**: See FILE_TRANSFER_GUIDE.md
- **Implementation**: See IMPLEMENTATION_SUMMARY.md

## 💡 Example Workflow

```
1. APP STARTS
   └─ Server/Client selection

2. CONNECT DEVICES
   Server: Start listening port 8888
   Client: Connect to server IP

3. CONFIGURE ENCRYPTION
   Settings → Select AES-256
   Enter key: "my_secret_key_123"

4. SEND MESSAGE
   Type: "Hello secure world!"
   Send → Auto-encrypted with AES-256
   Receive → Auto-decrypted

5. SEND FILE
   Click 📎 → Select document.pdf
   Auto-validates → Sends via TCP
   Receive → Verifies checksum
```

## ✨ Key Features

🔐 **4 Encryption Methods**
- AES-256, DES, Caesar, RSA-like

✍️ **Digital Signatures**
- HMAC-SHA256 message authentication

📁 **Secure File Transfer**
- 13+ file types, 10MB limit

💬 **Real-time Messaging**
- TCP socket communication

⏰ **Auto-delete Messages**
- 5-300 second timers

## 🎓 Learning Path

```
Beginner:
  1. Use Caesar cipher (learn basics)
  2. Send simple messages
  3. Read ENCRYPTION_METHODS.md

Intermediate:
  4. Switch to DES
  5. Try different keys
  6. Send files

Advanced:
  7. Use AES-256
  8. Study digital signatures
  9. Review source code
```

## 📞 Support

**Repository**: https://github.com/nminh271004-max/chatnet3

**Issues**: https://github.com/nminh271004-max/chatnet3/issues

---

**Status**: 🟢 Production Ready  
**Tests**: ✅ 81/81 Passing  
**Version**: 1.0.0  
**Last Updated**: January 18, 2026
