## 💻 Code Examples - Using New Features

### 1. FILE VALIDATION

```typescript
// Validate a file before sending
const fileData: FileData = {
  fileName: 'photo.jpg',
  fileSize: 2500000,
  fileContent: base64String,
  mimeType: 'image/jpeg',
  type: 'image',
};

// Single validation
const sizeCheck = fileHandler.validateFileSize(fileData.fileSize);
if (!sizeCheck.valid) {
  console.log(sizeCheck.message); // "File quá lớn. Tối đa: ..."
}

// Comprehensive validation
const fullValidation = fileHandler.validateFileData(fileData);
if (!fullValidation.valid) {
  Alert.alert('Lỗi file', fullValidation.message);
  return;
}

// MIME type validation
const mimeCheck = fileHandler.validateMimeType(fileData.mimeType, 'image');
if (!mimeCheck.valid) {
  console.log(mimeCheck.message); // "Định dạng ảnh không hỗ trợ"
}
```

### 2. FILE TRANSFER WITH PROGRESS

```typescript
// Track transfer progress
const [progress, setProgress] = useState(0);

const sendWithProgress = (fileData: FileData) => {
  const fileMessage = fileHandler.createFileMessage(fileData);
  const totalSize = fileMessage.length;
  let sent = 0;

  // Simulate progress
  const interval = setInterval(() => {
    sent += totalSize / 10;
    setProgress(Math.min((sent / totalSize) * 100, 99));

    if (sent >= totalSize) {
      setProgress(100);
      clearInterval(interval);
    }
  }, 100);

  // Send file...
};

// Display progress
<View style={styles.progressBar}>
  <View style={{ width: `${progress}%`, height: '100%' }} />
</View>
<Text>{progress}%</Text>
```

### 3. FILE HISTORY/RECENTS

```typescript
// Add to recents when sending
const sendFile = (fileData: FileData, recipientIp: string) => {
  // Add to recents history
  fileHistoryManager.addRecent(fileData, recipientIp);

  // Get recents later
  const recentFiles = fileHistoryManager.getRecents(10);

  // Filter by type
  const recentImages = fileHistoryManager.getRecentsByType('image', 5);

  // Filter by recipient
  const sentToIp = fileHistoryManager.getRecentsByRecipient('192.168.1.100');

  // Get statistics
  const stats = fileHistoryManager.getRecentStats();
  console.log(`Sent ${stats.totalFiles} files`);
  console.log(`${stats.images} are images`);
  console.log(`Total size: ${fileHandler.formatFileSize(stats.totalSize)}`);
};

// Time formatting
fileHistoryManager.recents.forEach(item => {
  const time = fileHistoryManager.formatRecentTime(item.sentAt);
  console.log(`Sent ${item.fileData.fileName} ${time}`);
  // "Sent photo.jpg 5m trước"
});

// Clear history
fileHistoryManager.clearRecents();
```

### 4. THUMBNAIL CACHING

```typescript
// Get cached thumbnail
const getThumbnail = (fileData: FileData) => {
  const thumbnail = thumbnailCache.getThumbnail(fileData);
  return thumbnail; // Smaller base64 string
};

// Check cache stats
const stats = thumbnailCache.getCacheStats();
console.log(`Cached ${stats.cached}/${stats.maxSize} items`);
console.log(`Memory: ${stats.estimatedMemory}`);

// Manual cache control
thumbnailCache.removeFromCache('photo.jpg', 2500000);
thumbnailCache.clearCache();
```

### 5. FILE VALIDATION WITH ERROR HANDLING

```typescript
// Complete error handling
const handleFileReceived = (message: string) => {
  const result = fileHandler.parseFileMessage(message);

  if (!result) {
    // Not a file message
    console.log('Text message');
    return;
  }

  const { fileData, valid, error } = result;

  if (!valid) {
    // File validation failed
    Alert.alert('⚠️ Lỗi file', `Không thể nhận file: ${error}`);
    console.log(`Validation error: ${error}`);
    return;
  }

  // File is valid
  console.log(`Received valid file: ${fileData.fileName}`);
  displayImage(fileData);
};
```

### 6. UI INTEGRATION EXAMPLES

```typescript
// Pick and send image with validation
const handlePickImage = async () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
    },
    (response) => {
      if (response.assets?.[0]) {
        const asset = response.assets[0];

        // Create file data
        const fileData: FileData = {
          fileName: asset.fileName || 'photo.jpg',
          fileSize: asset.fileSize || 0,
          fileContent: asset.base64 || '',
          mimeType: asset.type || 'image/jpeg',
          type: 'image',
        };

        // Validate
        const validation = fileHandler.validateFileData(fileData);
        if (!validation.valid) {
          Alert.alert('Lỗi', validation.message);
          return;
        }

        // Send
        sendFile(fileData);
      }
    }
  );
};

// Long-press menu
<TouchableOpacity
  onLongPress={() => {
    if (msg.file) {
      setSelectedFile(msg.file);
      setShowFileMenu(true);
    }
  }}
>
  <Image
    source={{
      uri: `data:${msg.file.mimeType};base64,${msg.file.fileContent}`,
    }}
  />
</TouchableOpacity>

// File menu actions
const downloadFile = (fileData: FileData) => {
  Alert.alert(
    'Tải xuống',
    `${fileData.fileName}\n${fileHandler.formatFileSize(fileData.fileSize)}`,
    [
      {
        text: 'Chia sẻ',
        onPress: () => shareFile(fileData),
      },
    ]
  );
};

// Recents modal
<TouchableOpacity onPress={() => setShowRecents(true)}>
  <Text>⏱️ Recent Files ({fileHistoryManager.recents.length})</Text>
</TouchableOpacity>

// Display recents list
{fileHistoryManager.recents.map((item) => (
  <TouchableOpacity
    onPress={() => {
      sendFile(item.fileData);
      setShowRecents(false);
    }}
  >
    <Text>
      {item.fileData.fileName}
      {' • '}
      {fileHistoryManager.formatRecentTime(item.sentAt)}
    </Text>
  </TouchableOpacity>
))}
```

### 7. PROGRESS BAR DISPLAY

```typescript
// Render progress bar
{msg.isLoading && (
  <>
    <View style={styles.progressBar}>
      <View
        style={{
          width: `${transferProgress}%`,
          height: '100%',
          backgroundColor: '#4CAF50',
        }}
      />
    </View>
    <Text>{transferProgress}%</Text>
    <ActivityIndicator />
  </>
)}
```

### 8. FILE STATS

```typescript
// Get file information
const fileInfo = fileHandler.getFileInfo(fileData);
// "photo.jpg (2.5 MB) - .jpg"

// Format size
const formatted = fileHandler.formatFileSize(2500000);
// "2.44 MB"

// Check if image
const isImage = fileHandler.isImageFile('image/jpeg');
// true

// Get extension
const ext = fileHandler.getFileExtension('photo.jpg');
// "jpg"
```

### 9. ENCRYPTION WITH FILES

```typescript
// Send encrypted file
const sendEncryptedFile = (fileData: FileData, key: string) => {
  // Create file message
  const fileMessage = fileHandler.createFileMessage(fileData);

  // Encrypt the entire message
  const encrypted = encryptDES(fileMessage, parseKey(key));

  // Send encrypted message
  client.write(encrypted, 'utf8');
};

// Receive and decrypt
const handleEncryptedMessage = (encryptedMessage: string, key: string) => {
  // Decrypt
  const decrypted = decryptDES(encryptedMessage, parseKey(key));

  // Parse file
  const result = fileHandler.parseFileMessage(decrypted);

  if (result?.valid) {
    // Process file
    displayImage(result.fileData);
  } else if (result?.error) {
    // Handle error
    console.log(`File error: ${result.error}`);
  } else {
    // Text message
    console.log(`Text: ${decrypted}`);
  }
};
```

### 10. ERROR SCENARIOS

```typescript
// File too large
const result = fileHandler.validateFileSize(15 * 1024 * 1024);
// { valid: false, message: "File quá lớn. Tối đa: 10 MB, Hiện tại: 14.31 MB" }

// Invalid MIME type
const result = fileHandler.validateMimeType('application/pdf', 'image');
// { valid: false, message: "Định dạng ảnh không hỗ trợ: application/pdf\nHỗ trợ: JPEG, PNG, GIF, WebP" }

// Invalid file name
const result = fileHandler.validateFileName('photo<>.jpg');
// { valid: false, message: "Tên file chứa ký tự không hợp lệ" }

// Corrupted base64
const result = fileHandler.validateBase64Content('!!!invalid!!!');
// { valid: false, message: "Nội dung file bị hư hỏng (Base64 không hợp lệ)" }

// Checksum mismatch (file corrupted in transit)
const result = fileHandler.parseFileMessage(corruptedMessage);
// { fileData, valid: false, error: "File bị hư hỏng (checksum không khớp)" }
```

---

## 📚 Complete Integration Example

```typescript
import { fileHandler, fileHistoryManager, thumbnailCache, FileData } from './src/utils/fileHandler';

// Full flow
const handleImageShare = async () => {
  // 1. Pick image
  launchImageLibrary(
    { mediaType: 'photo', includeBase64: true, quality: 0.8 },
    (response) => {
      if (!response.assets?.[0]) return;

      // 2. Create file data
      const fileData: FileData = {
        fileName: response.assets[0].fileName || 'photo.jpg',
        fileSize: response.assets[0].fileSize || 0,
        fileContent: response.assets[0].base64 || '',
        mimeType: response.assets[0].type || 'image/jpeg',
        type: 'image',
      };

      // 3. Validate
      const validation = fileHandler.validateFileData(fileData);
      if (!validation.valid) {
        Alert.alert('Lỗi', validation.message);
        return;
      }

      // 4. Add to recents
      fileHistoryManager.addRecent(fileData, targetIp);

      // 5. Create message with checksum
      const message = fileHandler.createFileMessage(fileData);

      // 6. Encrypt if needed
      const toSend = isEncrypted
        ? encryptDES(message, parseKey(key))
        : message;

      // 7. Send with progress tracking
      sendFileWithProgress(toSend, fileData.fileSize);

      // 8. Cache thumbnail
      const thumb = thumbnailCache.getThumbnail(fileData);

      // 9. Show stats
      const stats = fileHistoryManager.getRecentStats();
      console.log(`Total sent: ${stats.totalFiles} files`);
    }
  );
};
```

---

**Created**: November 30, 2025
