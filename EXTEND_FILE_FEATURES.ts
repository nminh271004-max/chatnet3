/**
 * 📚 FILE REFERENCE - Examples of extending ChatNET file features
 * 
 * ⚠️ IMPORTANT: This is a REFERENCE file only - do NOT add to the project!
 * Copy and adapt the functions you need into App.tsx
 * 
 * 🎯 Purpose: Show how to extend ChatNET to support:
 *   - Multiple file types (video, documents)
 *   - File download/save functionality
 *   - Progress indicators
 *   - Batch operations
 *   - Error retry logic
 */

// @ts-nocheck - Ignore TypeScript errors in this reference file

// ============================
// 1. GỬI NHIỀU LOẠI FILE
// ============================

const sendMultipleFileTypes = async () => {
  try {
    // Ví dụ: Cho phép chọn cả ảnh và tài liệu
    const options = {
      mediaType: 'mixed', // 'photo', 'video', 'mixed'
      includeBase64: true,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        // Process and send
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================
// 2. GỬI VIDEO
// ============================

const sendVideo = async () => {
  launchImageLibrary(
    {
      mediaType: 'video',
      includeBase64: true,
    },
    (response) => {
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        const fileData: FileData = {
          fileName: asset.fileName || 'video.mp4',
          fileSize: asset.fileSize || 0,
          fileContent: asset.base64 || '',
          mimeType: asset.type || 'video/mp4',
          type: 'video', // Thêm 'video' type
        };
        sendFile(fileData);
      }
    }
  );
};

// ============================
// 3. GỬI TÀI LIỆU (PDF, DOCX, etc.)
// ============================

const sendDocument = async () => {
  try {
    // Yêu cầu: npm install react-native-document-picker
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.pdf],
      // Hoặc múi loại: ['.pdf', '.doc', '.docx', '.txt']
    });

    if (result) {
      const base64 = await readFileAsBase64(result.uri);

      const fileData: FileData = {
        fileName: result.name,
        fileSize: result.size,
        fileContent: base64,
        mimeType: result.type,
        type: 'document',
      };
      sendFile(fileData);
    }
  } catch (error) {
    console.error('Error picking document:', error);
  }
};

// ============================
// 4. HỖ TRỢ DOWNLOAD/LƯU FILE
// ============================

import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';

const saveReceivedFile = async (fileData: FileData) => {
  try {
    if (fileData.type === 'image') {
      // Lưu ảnh vào Camera Roll
      const base64Data = fileData.fileContent;
      const imagePath = `${RNFS.DocumentDirectoryPath}/${fileData.fileName}`;

      await RNFS.writeFile(imagePath, base64Data, 'base64');
      await CameraRoll.save(imagePath, { type: 'photo' });

      Alert.alert('Thành công', `Ảnh đã lưu vào thư viện`);
    } else if (fileData.type === 'document' || fileData.type === 'video') {
      // Lưu file vào Documents
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileData.fileName}`;
      await RNFS.writeFile(filePath, fileData.fileContent, 'base64');

      Alert.alert('Thành công', `File đã lưu tại: ${filePath}`);
    }
  } catch (error) {
    Alert.alert('Lỗi', 'Không thể lưu file: ' + (error as any).message);
  }
};

// ============================
// 5. THUMBNAIL CHO VIDEO
// ============================

const displayVideoThumbnail = (fileData: FileData) => {
  // Để render video thumbnail, thêm vào JSX ở App.tsx:
  // {fileData.type === 'video' && (
  //   <View style={styles.videoContainer}>
  //     <View style={styles.videoThumbnail}>
  //       <Text style={styles.videoIcon}>🎥</Text>
  //     </View>
  //     <View style={styles.fileInfo}>
  //       <Text style={styles.fileName}>{fileData.fileName}</Text>
  //       <Text style={styles.fileSize}>
  //         {fileHandler.formatFileSize(fileData.fileSize)}
  //       </Text>
  //     </View>
  //   </View>
  // )}

  if (fileData.type === 'video') {
    console.log('Video file:', fileData.fileName);
  }
};

// ============================
// 6. PROGRESS BAR CHO TẢI LỀN FILE
// ============================

const sendFileWithProgress = (fileData: FileData) => {
  const totalSize = fileData.fileContent.length;
  const chunkSize = 1024 * 10; // 10KB chunks
  let sentBytes = 0;

  const sendChunk = () => {
    if (sentBytes >= totalSize) {
      // Done
      return;
    }

    const chunk = fileData.fileContent.slice(sentBytes, sentBytes + chunkSize);
    sentBytes += chunkSize;

    // Update progress
    const progress = Math.round((sentBytes / totalSize) * 100);
    setUploadProgress(progress);

    // Send chunk
    // ...
  };

  sendChunk();
};

// ============================
// 7. HỖ TRỢ MULTIPLE FILES
// ============================

const sendMultipleFiles = async (fileDataArray: FileData[]) => {
  for (const fileData of fileDataArray) {
    await sendFile(fileData);
    // Delay between files
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// ============================
// 8. COMPRESSED IMAGE
// ============================

const sendCompressedImage = async () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.5, // Giảm chất lượng để nhỏ hơn
    },
    (response) => {
      if (response.assets?.[0]) {
        const asset = response.assets[0];
        const originalSize = asset.fileSize || 0;
        const base64 = asset.base64 || '';

        // Ước tính kích thước sau encode
        const estimatedSize = (base64.length * 3) / 4;

        Alert.alert(
          'Kích thước ảnh',
          `Gốc: ${fileHandler.formatFileSize(originalSize)}\nDự kiến: ${fileHandler.formatFileSize(estimatedSize)}`
        );

        const fileData: FileData = {
          fileName: asset.fileName || 'photo_compressed.jpg',
          fileSize: estimatedSize,
          fileContent: base64,
          mimeType: 'image/jpeg',
          type: 'image',
        };

        sendFile(fileData);
      }
    }
  );
};

// ============================
// 9. CACHE RECEIVED FILES
// ============================

const cacheManager = {
  cache: new Map<string, FileData>(),

  save(fileData: FileData) {
    const key = `${fileData.fileName}_${Date.now()}`;
    this.cache.set(key, fileData);
    return key;
  },

  get(key: string): FileData | undefined {
    return this.cache.get(key);
  },

  clear() {
    this.cache.clear();
  },

  getAll(): FileData[] {
    return Array.from(this.cache.values());
  },
};

// ============================
// 10. BATCH SEND WITH RETRY
// ============================

const sendFileWithRetry = async (
  fileData: FileData,
  maxRetries: number = 3
) => {
  let attempts = 0;

  const attempt = async () => {
    try {
      await sendFile(fileData);
    } catch (error) {
      attempts++;
      if (attempts < maxRetries) {
        // Retry sau 2 giây
        await new Promise(resolve => setTimeout(resolve, 2000));
        await attempt();
      } else {
        throw error;
      }
    }
  };

  await attempt();
};

// ============================
// PACKAGE REQUIREMENTS
// ============================

/**
 * Để sử dụng tất cả feature này, cần cài:
 *
 * npm install react-native-document-picker
 * npm install react-native-fs
 * npm install @react-native-camera-roll/camera-roll
 *
 * Hoặc từng cái tùy theo nhu cầu
 */

export {
  sendMultipleFileTypes,
  sendVideo,
  sendDocument,
  saveReceivedFile,
  displayVideoThumbnail,
  sendFileWithProgress,
  sendMultipleFiles,
  sendCompressedImage,
  cacheManager,
  sendFileWithRetry,
};
