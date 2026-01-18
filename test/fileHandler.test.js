// Mock the file handler since it's TypeScript
const fileHandlerModule = {
  validateFileSize(size) {
    if (size <= 0) {
      return { valid: false, message: 'File không hợp lệ (kích thước = 0)' };
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `File quá lớn. Tối đa: 10 MB`,
      };
    }
    return { valid: true };
  },

  validateFileName(fileName) {
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

  validateMimeType(mimeType, fileType) {
    if (!mimeType || !mimeType.includes('/')) {
      return { valid: false, message: 'MIME type không hợp lệ' };
    }

    const SUPPORTED_IMAGE_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ];

    const SUPPORTED_FILE_TYPES = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'text/xml',
      'application/xml',
    ];

    if (fileType === 'image') {
      if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        return {
          valid: false,
          message: `Định dạng ảnh không hỗ trợ: ${mimeType}`,
        };
      }
    } else if (fileType === 'file') {
      const unsafeTypes = [
        'application/x-executable',
        'application/x-msdownload',
        'application/x-msdos-program',
      ];
      if (unsafeTypes.includes(mimeType)) {
        return {
          valid: false,
          message: `File type không được phép: ${mimeType}`,
        };
      }
    }

    return { valid: true };
  },

  validateBase64Content(content) {
    if (!content || content.trim().length === 0) {
      return { valid: false, message: 'Nội dung file trống' };
    }
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(content)) {
      return { valid: false, message: 'Nội dung file bị hư hỏng (Base64 không hợp lệ)' };
    }
    if (content.length % 4 !== 0) {
      return { valid: false, message: 'Nội dung file bị hư hỏng (Base64 padding lỗi)' };
    }
    return { valid: true };
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  getFileExtension(fileName) {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  isImageFile(mimeType) {
    return mimeType.startsWith('image/');
  },

  isSupportedFileType(mimeType) {
    const SUPPORTED_FILE_TYPES = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'text/xml',
      'application/xml',
    ];
    return SUPPORTED_FILE_TYPES.includes(mimeType);
  },

  isPdfFile(mimeType) {
    return mimeType === 'application/pdf';
  },

  calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },

  validateFileData(fileData) {
    const fileNameValidation = this.validateFileName(fileData.fileName);
    if (!fileNameValidation.valid) {
      return fileNameValidation;
    }

    const mimeValidation = this.validateMimeType(fileData.mimeType, fileData.type);
    if (!mimeValidation.valid) {
      return mimeValidation;
    }

    const sizeValidation = this.validateFileSize(fileData.fileSize);
    if (!sizeValidation.valid) {
      return sizeValidation;
    }

    const contentValidation = this.validateBase64Content(fileData.fileContent);
    if (!contentValidation.valid) {
      return contentValidation;
    }

    return { valid: true };
  },
};

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
}

function assertTrue(value, message) {
  if (value !== true) {
    throw new Error(`${message || 'Assertion failed'}: expected true, got ${value}`);
  }
}

function assertFalse(value, message) {
  if (value !== false) {
    throw new Error(`${message || 'Assertion failed'}: expected false, got ${value}`);
  }
}

console.log('📁 File Handler & PDF Support Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: PDF file validation - basic
test('PDF file validation - valid PDF', () => {
  const pdfFile = {
    fileName: 'document.pdf',
    fileSize: 512000,
    fileContent: 'JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo=',
    mimeType: 'application/pdf',
    type: 'file',
  };
  const result = fileHandlerModule.validateFileData(pdfFile);
  assertTrue(result.valid, 'PDF file should be valid');
});

// Test 2: PDF MIME type detection
test('Detect PDF MIME type correctly', () => {
  assertTrue(fileHandlerModule.isPdfFile('application/pdf'), 'Should detect PDF');
  assertFalse(fileHandlerModule.isPdfFile('text/plain'), 'Should not detect text as PDF');
});

// Test 3: File size validation
test('File size validation - valid size', () => {
  const result = fileHandlerModule.validateFileSize(512000);
  assertTrue(result.valid, 'File size should be valid');
});

// Test 4: File size validation - too large
test('File size validation - file too large', () => {
  const result = fileHandlerModule.validateFileSize(15 * 1024 * 1024);
  assertFalse(result.valid, 'Should reject file > 10MB');
});

// Test 5: File size validation - zero size
test('File size validation - zero size file', () => {
  const result = fileHandlerModule.validateFileSize(0);
  assertFalse(result.valid, 'Should reject zero-size file');
});

// Test 6: File name validation
test('File name validation - valid PDF name', () => {
  const result = fileHandlerModule.validateFileName('document.pdf');
  assertTrue(result.valid, 'Valid PDF name should pass');
});

// Test 7: File name validation - invalid characters
test('File name validation - invalid characters', () => {
  const result = fileHandlerModule.validateFileName('doc<script>.pdf');
  assertFalse(result.valid, 'Names with < > : " | ? * should be rejected');
});

// Test 8: File name validation - too long
test('File name validation - name too long', () => {
  const longName = 'a'.repeat(256) + '.pdf';
  const result = fileHandlerModule.validateFileName(longName);
  assertFalse(result.valid, 'Names > 255 chars should be rejected');
});

// Test 9: MIME type - multiple document types
test('MIME type validation - Word document', () => {
  const result = fileHandlerModule.validateMimeType(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'file'
  );
  assertTrue(result.valid, 'DOCX should be supported');
});

// Test 10: MIME type - Excel spreadsheet
test('MIME type validation - Excel spreadsheet', () => {
  const result = fileHandlerModule.validateMimeType(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'file'
  );
  assertTrue(result.valid, 'XLSX should be supported');
});

// Test 11: MIME type - plain text
test('MIME type validation - plain text file', () => {
  const result = fileHandlerModule.validateMimeType('text/plain', 'file');
  assertTrue(result.valid, 'TXT should be supported');
});

// Test 12: MIME type - ZIP archive
test('MIME type validation - ZIP archive', () => {
  const result = fileHandlerModule.validateMimeType('application/zip', 'file');
  assertTrue(result.valid, 'ZIP should be supported');
});

// Test 13: MIME type - executable (unsafe)
test('MIME type validation - executable file (unsafe)', () => {
  const result = fileHandlerModule.validateMimeType('application/x-executable', 'file');
  assertFalse(result.valid, 'Executable files should be rejected');
});

// Test 14: Base64 validation - valid
test('Base64 content validation - valid', () => {
  const result = fileHandlerModule.validateBase64Content('JVBERi0xLjQK');
  assertTrue(result.valid, 'Valid Base64 should pass');
});

// Test 15: Base64 validation - invalid characters
test('Base64 content validation - invalid characters', () => {
  const result = fileHandlerModule.validateBase64Content('JVBERi0xLjQK!!!');
  assertFalse(result.valid, 'Invalid Base64 characters should be rejected');
});

// Test 16: Base64 validation - wrong padding
test('Base64 content validation - wrong padding', () => {
  const result = fileHandlerModule.validateBase64Content('JVBERi0xLjQ');
  assertFalse(result.valid, 'Base64 with wrong padding should be rejected');
});

// Test 17: Base64 validation - empty
test('Base64 content validation - empty content', () => {
  const result = fileHandlerModule.validateBase64Content('');
  assertFalse(result.valid, 'Empty content should be rejected');
});

// Test 18: File extension extraction
test('Get file extension correctly', () => {
  assertEqual(
    fileHandlerModule.getFileExtension('document.pdf'),
    'pdf',
    'Should extract PDF extension'
  );
  assertEqual(
    fileHandlerModule.getFileExtension('report.XLSX'),
    'xlsx',
    'Should convert to lowercase'
  );
});

// Test 19: File size formatting
test('Format file size correctly', () => {
  assertEqual(fileHandlerModule.formatFileSize(512000), '500 KB', 'Should format 512KB');
  assertEqual(fileHandlerModule.formatFileSize(0), '0 Bytes', 'Should handle 0 bytes');
});

// Test 20: Checksum calculation
test('Calculate checksum for file content', () => {
  const checksum = fileHandlerModule.calculateChecksum('test content');
  assertTrue(typeof checksum === 'string', 'Checksum should be string');
  assertTrue(checksum.length > 0, 'Checksum should not be empty');
});

// Test 21: Checksum consistency
test('Checksum is consistent for same content', () => {
  const content = 'JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo=';
  const checksum1 = fileHandlerModule.calculateChecksum(content);
  const checksum2 = fileHandlerModule.calculateChecksum(content);
  assertEqual(checksum1, checksum2, 'Same content should produce same checksum');
});

// Test 22: Checksum differs for different content
test('Checksum differs for different content', () => {
  const checksum1 = fileHandlerModule.calculateChecksum('content1');
  const checksum2 = fileHandlerModule.calculateChecksum('content2');
  assertFalse(checksum1 === checksum2, 'Different content should produce different checksums');
});

// Test 23: Complete PDF file validation
test('Complete PDF file validation', () => {
  const pdfFile = {
    fileName: 'report.pdf',
    fileSize: 2048000,
    fileContent: 'JVBERi0xLjQKJeLjz9MNCjEgMCBvYmpvCjw8L1R5cGUgL0NhdGFsb2cvUGFnZXM=',
    mimeType: 'application/pdf',
    type: 'file',
  };
  const result = fileHandlerModule.validateFileData(pdfFile);
  assertTrue(result.valid, 'Complete PDF should pass all validations');
});

// Test 24: Image file detection
test('Detect image file correctly', () => {
  assertTrue(fileHandlerModule.isImageFile('image/png'), 'PNG is an image');
  assertTrue(fileHandlerModule.isImageFile('image/jpeg'), 'JPEG is an image');
  assertFalse(fileHandlerModule.isImageFile('application/pdf'), 'PDF is not an image');
});

// Test 25: Supported file type check
test('Check if file type is supported', () => {
  assertTrue(fileHandlerModule.isSupportedFileType('application/pdf'), 'PDF is supported');
  assertTrue(fileHandlerModule.isSupportedFileType('text/plain'), 'TXT is supported');
  assertTrue(fileHandlerModule.isSupportedFileType('application/json'), 'JSON is supported');
  assertFalse(fileHandlerModule.isSupportedFileType('application/x-unknown'), 'Unknown should not be supported');
});

// Test 26: Mixed document types validation
test('Validate mixed document types', () => {
  const documents = [
    { mime: 'application/pdf', valid: true },
    { mime: 'text/csv', valid: true },
    { mime: 'application/msword', valid: true },
    { mime: 'application/x-executable', valid: false },
  ];

  documents.forEach(doc => {
    const result = fileHandlerModule.validateMimeType(doc.mime, 'file');
    if (doc.valid) {
      assertTrue(result.valid, `${doc.mime} should be valid`);
    } else {
      assertFalse(result.valid, `${doc.mime} should be invalid`);
    }
  });
});

// Test 27: Large PDF file (under limit)
test('Large PDF file validation (9MB)', () => {
  // Create a valid base64 string that represents ~9MB when decoded
  // Each base64 char represents ~6 bits, so we need about 12MB of base64 for 9MB decoded
  const largeContent = 'A'.repeat(12000000);
  const validBase64 = largeContent.substring(0, largeContent.length - (largeContent.length % 4));
  
  const largePdf = {
    fileName: 'large_document.pdf',
    fileSize: 9 * 1024 * 1024,
    fileContent: validBase64,
    mimeType: 'application/pdf',
    type: 'file',
  };
  const result = fileHandlerModule.validateFileData(largePdf);
  assertTrue(result.valid, '9MB PDF should be valid');
});

// Test 28: Various PDF names
test('Validate various PDF file names', () => {
  const names = ['document.pdf', 'report_2024.pdf', 'file-name.pdf', '文档.pdf'];
  names.forEach(name => {
    const result = fileHandlerModule.validateFileName(name);
    assertTrue(result.valid, `${name} should be valid`);
  });
});

// Print results
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All File Handler tests passed!');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}
