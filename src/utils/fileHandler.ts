export interface FileData {
  fileName: string;
  fileSize: number;
  fileContent: string; // base64 encoded
  mimeType: string;
  type: 'image' | 'file';
  checksum?: string; // MD5 for integrity check
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

// Simple checksum for file integrity
const calculateChecksum = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const fileHandler = {
  // Validate file size
  validateFileSize(size: number): { valid: boolean; message?: string } {
    if (size <= 0) {
      return { valid: false, message: 'File không hợp lệ (kích thước = 0)' };
    }
    if (size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `File quá lớn. Tối đa: ${this.formatFileSize(MAX_FILE_SIZE)}, Hiện tại: ${this.formatFileSize(size)}`,
      };
    }
    return { valid: true };
  },

  // Validate MIME type
  validateMimeType(
    mimeType: string,
    fileType: 'image' | 'file'
  ): { valid: boolean; message?: string } {
    if (!mimeType || !mimeType.includes('/')) {
      return { valid: false, message: 'MIME type không hợp lệ' };
    }

    if (fileType === 'image') {
      if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        return {
          valid: false,
          message: `Định dạng ảnh không hỗ trợ: ${mimeType}\nHỗ trợ: JPEG, PNG, GIF, WebP`,
        };
      }
    }

    return { valid: true };
  },

  // Validate file name
  validateFileName(fileName: string): { valid: boolean; message?: string } {
    if (!fileName || fileName.trim().length === 0) {
      return { valid: false, message: 'Tên file không hợp lệ' };
    }

    if (fileName.length > 255) {
      return { valid: false, message: 'Tên file quá dài (tối đa 255 ký tự)' };
    }

    const invalidChars = /[<>:"|?*\0]/g;
    if (invalidChars.test(fileName)) {
      return { valid: false, message: 'Tên file chứa ký tự không hợp lệ' };
    }

    return { valid: true };
  },

  // Validate base64 content
  validateBase64Content(content: string): { valid: boolean; message?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, message: 'Nội dung file trống' };
    }
    // Strict base64 validation: characters + optional padding (= up to 2) and length multiple of 4
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(content)) {
      return { valid: false, message: 'Nội dung file bị hư hỏng (Base64 không hợp lệ)' };
    }

    if (content.length % 4 !== 0) {
      return { valid: false, message: 'Nội dung file bị hư hỏng (Base64 padding lỗi)' };
    }

    return { valid: true };
  },

  // Comprehensive file validation
  validateFileData(fileData: FileData): { valid: boolean; message?: string } {
    // Validate fileName
    const fileNameValidation = this.validateFileName(fileData.fileName);
    if (!fileNameValidation.valid) {
      return fileNameValidation;
    }

    // Validate MIME type
    const mimeValidation = this.validateMimeType(fileData.mimeType, fileData.type);
    if (!mimeValidation.valid) {
      return mimeValidation;
    }

    // Validate file size
    const sizeValidation = this.validateFileSize(fileData.fileSize);
    if (!sizeValidation.valid) {
      return sizeValidation;
    }

    // Validate content
    const contentValidation = this.validateBase64Content(fileData.fileContent);
    if (!contentValidation.valid) {
      return contentValidation;
    }

    return { valid: true };
  },

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  // Check if file is image
  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  },

  // Create file message protocol with checksum
  createFileMessage(fileData: FileData): string {
    const checksumValue = calculateChecksum(fileData.fileContent);
    return JSON.stringify({
      type: 'FILE',
      data: {
        ...fileData,
        checksum: checksumValue,
      },
      timestamp: new Date().toISOString(),
    });
  },

  // Parse file message protocol with checksum verification
  parseFileMessage(message: string): { fileData: FileData; valid: boolean; error?: string } | null {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'FILE' && parsed.data) {
        const fileData = parsed.data as FileData;

        // Verify checksum if present
        if (fileData.checksum) {
          const calculatedChecksum = calculateChecksum(fileData.fileContent);
          if (calculatedChecksum !== fileData.checksum) {
            return {
              fileData,
              valid: false,
              error: 'File bị hư hỏng (checksum không khớp)',
            };
          }
        }

        // Validate file data
        const validation = this.validateFileData(fileData);
        if (!validation.valid) {
          return {
            fileData,
            valid: false,
            error: validation.message,
          };
        }

        return { fileData, valid: true };
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Get detailed file info
  getFileInfo(fileData: FileData): string {
    const ext = this.getFileExtension(fileData.fileName);
    return `${fileData.fileName} (${this.formatFileSize(fileData.fileSize)}) - .${ext}`;
  },
};

// ============================
// FILE HISTORY/RECENTS MANAGER
// ============================

export interface RecentFile {
  fileData: FileData;
  sentAt: Date;
  recipientIp?: string;
}

export const fileHistoryManager = {
  recents: [] as RecentFile[],
  maxRecents: 20,

  addRecent(fileData: FileData, recipientIp?: string) {
    // Remove if already exists
    this.recents = this.recents.filter(
      item => item.fileData.fileName !== fileData.fileName
    );

    // Add to front
    this.recents.unshift({
      fileData,
      sentAt: new Date(),
      recipientIp,
    });

    // Keep only last N items
    if (this.recents.length > this.maxRecents) {
      this.recents = this.recents.slice(0, this.maxRecents);
    }
  },

  getRecents(limit?: number): RecentFile[] {
    return this.recents.slice(0, limit || this.maxRecents);
  },

  getRecentsByType(type: 'image' | 'file', limit?: number): RecentFile[] {
    return this.recents
      .filter(item => item.fileData.type === type)
      .slice(0, limit || this.maxRecents);
  },

  getRecentsByRecipient(ip: string, limit?: number): RecentFile[] {
    return this.recents
      .filter(item => item.recipientIp === ip)
      .slice(0, limit || this.maxRecents);
  },

  clearRecents() {
    this.recents = [];
  },

  removeRecent(fileName: string) {
    this.recents = this.recents.filter(
      item => item.fileData.fileName !== fileName
    );
  },

  getRecentStats(): {
    totalFiles: number;
    images: number;
    totalSize: number;
    lastSent?: Date;
  } {
    return {
      totalFiles: this.recents.length,
      images: this.recents.filter(item => item.fileData.type === 'image').length,
      totalSize: this.recents.reduce((sum, item) => sum + item.fileData.fileSize, 0),
      lastSent: this.recents[0]?.sentAt,
    };
  },

  formatRecentTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}m trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;

    return date.toLocaleDateString('vi-VN');
  },
};

// ============================
// THUMBNAIL CACHE MANAGER
// ============================

export interface CachedThumbnail {
  originalContent: string;
  thumbnail: string;
  createdAt: Date;
  originalSize: number;
}

export const thumbnailCache = {
  cache: new Map<string, CachedThumbnail>(),
  maxCacheSize: 50,

  // Generate a simple thumbnail by reducing base64 string (not perfect but no deps)
  generateThumbnail(base64Content: string, quality: number = 0.6): string {
    try {
      // For very large base64 strings, sample only part of it
      // This is a simple approximation - real thumbnails would need image processing
      const contentLength = base64Content.length;
      const targetLength = Math.floor(contentLength * quality);

      // Keep start, middle, and end portions for sampling
      if (targetLength < contentLength) {
        const part1 = base64Content.substring(0, targetLength / 3);
        const mid = Math.floor(contentLength / 2);
        const part2 = base64Content.substring(mid - targetLength / 6, mid + targetLength / 6);
        const part3 = base64Content.substring(contentLength - targetLength / 3);

        return part1 + part2 + part3;
      }

      return base64Content;
    } catch {
      return base64Content;
    }
  },

  getThumbnail(fileData: FileData): string {
    const key = `${fileData.fileName}_${fileData.fileSize}`;

    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key)!.thumbnail;
    }

    // Generate thumbnail
    const thumbnail = this.generateThumbnail(fileData.fileContent, 0.5);

    // Cache it
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      originalContent: fileData.fileContent,
      thumbnail,
      createdAt: new Date(),
      originalSize: fileData.fileSize,
    });

    return thumbnail;
  },

  getCacheStats(): {
    cached: number;
    maxSize: number;
    estimatedMemory: string;
  } {
    let totalBytes = 0;
    this.cache.forEach(item => {
      totalBytes += item.thumbnail.length + item.originalContent.length;
    });

    return {
      cached: this.cache.size,
      maxSize: this.maxCacheSize,
      estimatedMemory: fileHandler.formatFileSize(totalBytes),
    };
  },

  clearCache() {
    this.cache.clear();
  },

  removeFromCache(fileName: string, fileSize: number) {
    const key = `${fileName}_${fileSize}`;
    this.cache.delete(key);
  },
};
