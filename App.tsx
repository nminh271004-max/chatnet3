import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
  Modal,
  Image,
  ImageBackground,
  ActivityIndicator,
  Share,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import TcpSocket from 'react-native-tcp-socket';
import { launchImageLibrary } from 'react-native-image-picker';
import { encryptAES, decryptAES, isValidKey as isValidAESKey, parseKey } from './src/utils/aesEncryption';
import { encryptDES, decryptDES, isValidDESKey } from './src/utils/desEncryption';
import { encryptCaesar, decryptCaesar } from './src/utils/caesarCipher';
import { encryptRSA, decryptRSA, isValidRSAKey } from './src/utils/rsaEncryption';
import { fileHandler, FileData, fileHistoryManager, thumbnailCache } from './src/utils/fileHandler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isSmallScreen = SCREEN_HEIGHT < 700;
const isNarrowScreen = SCREEN_WIDTH < 360;
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const responsiveFontSize = (size: number) => {
  const scaledSize = moderateScale(size, 0.3);
  return Math.max(Math.min(scaledSize, size * 1.2), size * 0.85);
};

interface Message {
  text?: string;
  sender: 'me' | 'other';
  timestamp: Date;
  encrypted?: boolean;
  file?: FileData;
  isLoading?: boolean;
  username?: string; // Sender's username
  autoDeleteIn?: number; // milliseconds (0 = no auto-delete)
}

const PORT = 8888;

function App(): React.JSX.Element {
  const [myIp, setMyIp] = useState<string>('Đang lấy IP...');
  const [targetIp, setTargetIp] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string>('ChatNET1');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [showRecents, setShowRecents] = useState(false);
  const [username, setUsername] = useState<string>('ChatNET User');
  const [autoDeleteSeconds, setAutoDeleteSeconds] = useState<number>(0); // 0 = no auto-delete
  const [encryptionMethod, setEncryptionMethod] = useState<'AES' | 'DES' | 'Caesar' | 'RSA'>('AES'); // Encryption method selector
  const [caesarShift, setCaesarShift] = useState<number>(3); // Shift for Caesar cipher
  
  const serverRef = useRef<any>(null);
  const clientRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const encryptionKeyRef = useRef(encryptionKey);
  const isEncryptionEnabledRef = useRef(isEncryptionEnabled);
  const usernameRef = useRef(username);
  const autoDeleteSecondsRef = useRef(autoDeleteSeconds);
  const encryptionMethodRef = useRef(encryptionMethod);
  const caesarShiftRef = useRef(caesarShift);
  const autoDeleteTimersRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
  
  useEffect(() => {
    encryptionKeyRef.current = encryptionKey;
  }, [encryptionKey]);

  useEffect(() => {
    isEncryptionEnabledRef.current = isEncryptionEnabled;
  }, [isEncryptionEnabled]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    autoDeleteSecondsRef.current = autoDeleteSeconds;
  }, [autoDeleteSeconds]);

  useEffect(() => {
    encryptionMethodRef.current = encryptionMethod;
  }, [encryptionMethod]);

  useEffect(() => {
    caesarShiftRef.current = caesarShift;
  }, [caesarShift]);

  // Encryption helper functions
  const encryptMessage = (text: string, method: 'AES' | 'DES' | 'Caesar' | 'RSA', key: string, caesarShift?: number): string => {
    try {
      switch (method) {
        case 'AES':
          return encryptAES(text, key);
        case 'DES':
          return encryptDES(text, key);
        case 'Caesar':
          return encryptCaesar(text, caesarShift || 3);
        case 'RSA':
          return encryptRSA(text, key);
        default:
          return text;
      }
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  };

  const decryptMessage = (encryptedText: string, method: 'AES' | 'DES' | 'Caesar' | 'RSA', key: string, caesarShift?: number): string => {
    try {
      switch (method) {
        case 'AES':
          return decryptAES(encryptedText, key);
        case 'DES':
          return decryptDES(encryptedText, key);
        case 'Caesar':
          return decryptCaesar(encryptedText, caesarShift || 3);
        case 'RSA':
          return decryptRSA(encryptedText, key);
        default:
          return encryptedText;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  };

  const isValidEncryptionKey = (key: string, method: 'AES' | 'DES' | 'Caesar' | 'RSA'): boolean => {
    switch (method) {
      case 'AES':
      case 'DES':
        return isValidAESKey(key); // Both AES and DES use same validation
      case 'RSA':
        return isValidRSAKey(key); // RSA key validation
      case 'Caesar':
        return true; // Caesar doesn't need key validation, only shift
      default:
        return false;
    }
  };

    const fetchIpAddress = () => {
    setMyIp('Đang lấy IP...');
    NetInfo.fetch().then(state => {
      if (state.details && 'ipAddress' in state.details) {
        const ip = (state.details as any).ipAddress;
        setMyIp(ip || 'Không tìm thấy IP');
      } else {
        setMyIp('Không tìm thấy IP');
      }
    });
  };

  // Schedule auto-delete for a message
  const scheduleAutoDelete = (messageIndex: number, delayMs: number) => {
    const timer = setTimeout(() => {
      setMessages(prev => prev.filter((_, i) => i !== messageIndex));
      // Clean up timer reference
      delete autoDeleteTimersRef.current[messageIndex];
    }, delayMs);
    autoDeleteTimersRef.current[messageIndex] = timer;
  };

  // Cancel all pending auto-delete timers (e.g., on app close)
  const cancelAllAutoDeleteTimers = () => {
    Object.values(autoDeleteTimersRef.current).forEach(timer => clearTimeout(timer));
    autoDeleteTimersRef.current = {};
  };

  const saveImageToClipboard = (fileData: FileData) => {
    // Convert base64 to image for sharing
    const base64Image = fileData.fileContent;
    const imageUri = `data:${fileData.mimeType};base64,${base64Image}`;

    Share.share({
      url: imageUri,
      title: fileData.fileName,
      message: `Ảnh từ ChatNET: ${fileData.fileName}`,
    })
      .then(() => {
        setShowFileMenu(false);
        Alert.alert('Thành công', 'Chia sẻ ảnh thành công');
      })
      .catch((error) => {
        Alert.alert('Lỗi', 'Không thể chia sẻ ảnh: ' + error.message);
      });
  };

  const downloadFile = (fileData: FileData) => {
    // For now, show a toast/alert
    // In production, would save to device storage
    Alert.alert(
      'Tải xuống',
      `Ảnh: ${fileData.fileName}\nKích thước: ${fileHandler.formatFileSize(fileData.fileSize)}\n\nTính năng lưu file sẽ được thêm trong version tiếp theo.`,
      [
        {
          text: 'Chia sẻ',
          onPress: () => saveImageToClipboard(fileData),
        },
        {
          text: 'Đóng',
          onPress: () => setShowFileMenu(false),
        },
      ]
    );
  };

  const pickImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8,
      },
      (response: any) => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        const fileSize = asset.fileSize || 0;
        const base64 = asset.base64;
        const mimeType = asset.type || 'image/jpeg';

        if (!base64) {
          Alert.alert('Lỗi', 'Không thể đọc file ảnh');
          return;
        }

        const fileData: FileData = {
          fileName,
          fileSize,
          fileContent: base64,
          mimeType,
          type: 'image',
        };

        // Validate file data comprehensively
        const validation = fileHandler.validateFileData(fileData);
        if (!validation.valid) {
          Alert.alert('Lỗi file', validation.message || 'File không hợp lệ');
          return;
        }

        sendFile(fileData);
      }
    );
  };

  const sendFile = (fileData: FileData) => {
    if (!targetIp.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập IP đối phương trong Settings');
      return;
    }

    if (isEncryptionEnabled && !isValidEncryptionKey(encryptionKey, encryptionMethod)) {
      Alert.alert('Lỗi mã hóa', 'Key phải là 1-16 ký tự bất kỳ');
      return;
    }

    // Add to recents
    fileHistoryManager.addRecent(fileData, targetIp);

    setIsSendingFile(true);

    // Show loading message with username and auto-delete info
    const autoDeleteMs = autoDeleteSeconds > 0 ? autoDeleteSeconds * 1000 : 0;
    setMessages(prev => [
      ...prev,
      {
        sender: 'me',
        timestamp: new Date(),
        file: fileData,
        isLoading: true,
        username: usernameRef.current,
        autoDeleteIn: autoDeleteMs,
      },
    ]);

    try {
      let connectionTimeout: any;
      let isConnected = false;

      const fileMessage = fileHandler.createFileMessage(fileData);
      const messageToSend = isEncryptionEnabled
        ? encryptMessage(fileMessage, encryptionMethod, encryptionKey, caesarShift)
        : fileMessage;

      // Use a simple length-prefix framing: 10-digit zero-padded length + '|' + payload
      const payloadLength = messageToSend.length;
      const header = payloadLength.toString().padStart(10, '0') + '|';
      const framedMessage = header + messageToSend;

      // Calculate progress based on framed message size
      const totalMessageSize = framedMessage.length;

      const client = TcpSocket.createConnection(
        {
          port: PORT,
          host: targetIp,
        },
        () => {
          isConnected = true;
          clearTimeout(connectionTimeout);

          // Send framed message in chunks to avoid huge one-shot writes
          const chunkSize = Math.max(1024, Math.floor(totalMessageSize / 10));
          let sentBytes = 0;

          const sendChunk = () => {
            if (sentBytes >= totalMessageSize) {
              // Done sending
              setTransferProgress(100);
              setTimeout(() => {
                // Update message to remove loading state and schedule auto-delete if enabled
                setMessages(prev => {
                  const updated = prev.map((msg, idx) =>
                    idx === prev.length - 1 ? { ...msg, isLoading: false } : msg
                  );
                  if (autoDeleteSecondsRef.current > 0 && updated.length > 0) {
                    scheduleAutoDelete(updated.length - 1, autoDeleteSecondsRef.current * 1000);
                  }
                  return updated;
                });
                setIsSendingFile(false);
                setTransferProgress(0);
                client.destroy();
              }, 500);
              return;
            }

            const chunk = framedMessage.slice(sentBytes, sentBytes + chunkSize);
            sentBytes += chunk.length;

            // Update progress
            const progress = Math.floor((sentBytes / totalMessageSize) * 100);
            setTransferProgress(Math.min(progress, 99));

            client.write(chunk, 'utf8', (error) => {
              if (error) {
                Alert.alert('Lỗi', 'Không thể gửi file: ' + error.message);
                // Remove loading message
                setMessages(prev => prev.slice(0, -1));
                setIsSendingFile(false);
                setTransferProgress(0);
              } else {
                // Send next chunk
                sendChunk();
              }
            });
          };

          sendChunk();
        }
      );

      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          client.destroy();
          setIsSendingFile(false);
          setMessages(prev => prev.slice(0, -1));
          Alert.alert(
            'Lỗi kết nối',
            `Không thể kết nối đến ${targetIp}\n\nKiểm tra:\n• IP có đúng không?\n• Thiết bị có cùng WiFi không?\n• Ứng dụng đã mở ở thiết bị kia chưa?`
          );
        }
      }, 5000);

      client.on('error', (error: any) => {
        clearTimeout(connectionTimeout);
        setIsSendingFile(false);
        setMessages(prev => prev.slice(0, -1));

        let errorMessage = 'Không thể kết nối đến ' + targetIp;
        const errMsg = error?.message || '';

        if (errMsg.includes('ECONNREFUSED')) {
          errorMessage += '\n\n❌ Kết nối bị từ chối!\nỨng dụng chưa được mở ở thiết bị đích.';
        } else if (errMsg.includes('ETIMEDOUT') || errMsg.includes('timeout')) {
          errorMessage += '\n\n⏱️ Hết thời gian chờ!\nKiểm tra kết nối mạng và IP.';
        } else if (errMsg.includes('ENETUNREACH') || errMsg.includes('EHOSTUNREACH')) {
          errorMessage += '\n\n🌐 Không thể truy cập mạng!\nKiểm tra cả 2 thiết bị có cùng WiFi.';
        } else if (errMsg) {
          errorMessage += '\n\n' + errMsg;
        }

        Alert.alert('Lỗi kết nối', errorMessage);
      });

      client.on('close', () => {
        clearTimeout(connectionTimeout);
      });

      clientRef.current = client;
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể gửi file: ' + error.message);
      setIsSendingFile(false);
      setMessages(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    fetchIpAddress();
  }, []);

  useEffect(() => {
    if (!isServerRunning) {
      startServer();
    }

    return () => {
      if (serverRef.current) {
        serverRef.current.close();
      }
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, []);

  const startServer = () => {
    try {
      const server = TcpSocket.createServer((socket: any) => {
        // attach a receive buffer to the socket
        socket._recvBuffer = '';

        socket.on('data', (data: any) => {
          // Append new incoming data to buffer
          socket._recvBuffer += data.toString('utf8');

          const isEncryptionOn = isEncryptionEnabledRef.current;
          const currentKey = encryptionKeyRef.current;
          const currentEncryptionMethod = encryptionMethodRef.current;
          const currentCaesarShift = caesarShiftRef.current;

          // Process as many complete frames as available. Frame format: [10-byte length][|][payload]
          while (true) {
            // Need at least header (10 digits + '|')
            if (socket._recvBuffer.length < 11) break;

            const header = socket._recvBuffer.slice(0, 11);
            const lenStr = header.slice(0, 10);

            // If header is malformed, fall back to treating the whole buffer as a single message
            const payloadLen = parseInt(lenStr, 10);
            if (isNaN(payloadLen)) {
              // Legacy/invalid framing - process entire buffer as one message
              const receivedMessage = socket._recvBuffer;
              socket._recvBuffer = '';

              let displayMessage = receivedMessage;
              if (isEncryptionOn && isValidEncryptionKey(currentKey, currentEncryptionMethod)) {
                try {
                  displayMessage = decryptMessage(receivedMessage, currentEncryptionMethod, currentKey, currentCaesarShift);
                } catch (e) {
                  // decryption failed; leave as-is
                }
              }

              const fileMessage = fileHandler.parseFileMessage(displayMessage);
              if (fileMessage) {
                if (!fileMessage.valid && fileMessage.error) {
                  setMessages(prev => [
                    ...prev,
                    { text: `⚠️ Lỗi file: ${fileMessage.error}`, sender: 'other', timestamp: new Date(), encrypted: isEncryptionOn },
                  ]);
                } else {
                  setMessages(prev => [ ...prev, { sender: 'other', timestamp: new Date(), file: fileMessage.fileData }]);
                }
              } else {
                setMessages(prev => [ ...prev, { text: displayMessage, sender: 'other', timestamp: new Date(), encrypted: isEncryptionOn }]);
              }

              break;
            }

            // Wait until the full payload arrives
            if (socket._recvBuffer.length < 11 + payloadLen) break;

            const payload = socket._recvBuffer.slice(11, 11 + payloadLen);
            socket._recvBuffer = socket._recvBuffer.slice(11 + payloadLen);

            // Now process the complete payload
            let displayMessage = payload;
            if (isEncryptionOn && isValidEncryptionKey(currentKey, currentEncryptionMethod)) {
              try {
                displayMessage = decryptMessage(payload, currentEncryptionMethod, currentKey, currentCaesarShift);
              } catch (e) {
                // decryption may fail; keep original payload
              }
            }

            const fileMessage = fileHandler.parseFileMessage(displayMessage);
            if (fileMessage) {
              if (!fileMessage.valid && fileMessage.error) {
                setMessages(prev => [
                  ...prev,
                  { text: `⚠️ Lỗi file: ${fileMessage.error}`, sender: 'other', timestamp: new Date(), encrypted: isEncryptionOn },
                ]);
              } else {
                setMessages(prev => {
                  const updated = [ ...prev, { sender: 'other', timestamp: new Date(), file: fileMessage.fileData }];
                  // Note: file messages don't include username/autoDelete yet
                  return updated;
                });
              }
            } else {
              // Try to parse as TEXT message with metadata
              try {
                const parsed = JSON.parse(displayMessage);
                if (parsed.type === 'TEXT' && parsed.text) {
                  const { text, metadata } = parsed;
                  const username = metadata?.username || 'Unknown';
                  const autoDeleteMs = metadata?.autoDeleteIn || 0;
                  
                  setMessages(prev => {
                    const updated = [ ...prev, { text, sender: 'other', timestamp: new Date(), encrypted: isEncryptionOn, username, autoDeleteIn: autoDeleteMs }];
                    if (autoDeleteMs > 0) {
                      scheduleAutoDelete(updated.length - 1, autoDeleteMs);
                    }
                    return updated;
                  });
                } else {
                  // Fallback: treat as plain text
                  setMessages(prev => [ ...prev, { text: displayMessage, sender: 'other', timestamp: new Date(), encrypted: isEncryptionOn }]);
                }
              } catch (e) {
                // Not JSON, treat as plain text
                setMessages(prev => [ ...prev, { text: displayMessage, sender: 'other', timestamp: new Date(), encrypted: isEncryptionOn }]);
              }
            }
          }
        });

        socket.on('error', (error: any) => {
        });

        socket.on('close', () => {
        });
      });

      server.listen({ port: PORT, host: '0.0.0.0' }, () => {
        setIsServerRunning(true);
      });

      server.on('error', (error: any) => {
        Alert.alert('Lỗi', 'Không thể khởi động server: ' + error.message);
      });

      serverRef.current = server;
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể khởi động server: ' + error.message);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tin nhắn');
      return;
    }

    if (!targetIp.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập IP đối phương trong Settings');
      return;
    }

    if (isEncryptionEnabled && !isValidEncryptionKey(encryptionKey, encryptionMethod)) {
      Alert.alert('Lỗi mã hóa', 'Key phải là 1-16 ký tự bất kỳ');
      return;
    }

    const messageToSend = message.trim();
    
    // Wrap message with metadata: username and auto-delete info
    const metadata = {
      username: usernameRef.current,
      autoDeleteIn: autoDeleteSecondsRef.current > 0 ? autoDeleteSecondsRef.current * 1000 : 0,
    };
    const wrappedMessage = JSON.stringify({ type: 'TEXT', text: messageToSend, metadata });
    
    const encryptedMessage = isEncryptionEnabled 
      ? encryptMessage(wrappedMessage, encryptionMethod, encryptionKey, caesarShift)
      : wrappedMessage;
    
    setMessage('');

    try {
      let connectionTimeout: any;
      let isConnected = false;

      const client = TcpSocket.createConnection(
        {
          port: PORT,
          host: targetIp,
        },
        () => {
          isConnected = true;
          clearTimeout(connectionTimeout);

          // Frame the message so receiver can reassemble if data is split
          const payloadLen = encryptedMessage.length;
          const header = payloadLen.toString().padStart(10, '0') + '|';
          const framed = header + encryptedMessage;

          client.write(framed, 'utf8', (error) => {
            if (error) {
              Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ' + error.message);
            } else {
              const autoDeleteMs = autoDeleteSecondsRef.current > 0 ? autoDeleteSecondsRef.current * 1000 : 0;
              setMessages(prev => {
                const updated = [
                  ...prev,
                  {
                    text: messageToSend,
                    sender: 'me',
                    timestamp: new Date(),
                    encrypted: isEncryptionEnabled,
                    username: usernameRef.current,
                    autoDeleteIn: autoDeleteMs,
                  },
                ];
                if (autoDeleteMs > 0) {
                  scheduleAutoDelete(updated.length - 1, autoDeleteMs);
                }
                return updated;
              });
            }

            setTimeout(() => {
              client.destroy();
            }, 100);
          });
        }
      );

      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          client.destroy();
          Alert.alert(
            'Lỗi kết nối', 
            `Không thể kết nối đến ${targetIp}\n\nKiểm tra:\n• IP có đúng không?\n• Thiết bị có cùng WiFi không?\n• Ứng dụng đã mở ở thiết bị kia chưa?`
          );
        }
      }, 5000);

      client.on('error', (error: any) => {
        clearTimeout(connectionTimeout);
        
        let errorMessage = 'Không thể kết nối đến ' + targetIp;
        const errMsg = error?.message || '';
        
        if (errMsg.includes('ECONNREFUSED')) {
          errorMessage += '\n\n❌ Kết nối bị từ chối!\nỨng dụng chưa được mở ở thiết bị đích.';
        } else if (errMsg.includes('ETIMEDOUT') || errMsg.includes('timeout')) {
          errorMessage += '\n\n⏱️ Hết thời gian chờ!\nKiểm tra kết nối mạng và IP.';
        } else if (errMsg.includes('ENETUNREACH') || errMsg.includes('EHOSTUNREACH')) {
          errorMessage += '\n\n🌐 Không thể truy cập mạng!\nKiểm tra cả 2 thiết bị có cùng WiFi.';
        } else if (errMsg) {
          errorMessage += '\n\n' + errMsg;
        }
        
        Alert.alert('Lỗi kết nối', errorMessage);
      });

      client.on('close', () => {
        clearTimeout(connectionTimeout);
      });

      clientRef.current = client;
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ' + error.message);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0084ff" />
      <ImageBackground
        source={require('./assets/Logo.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>💬 ChatNET</Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.7}
            >
              <Image 
                source={require('./assets/setting.png')} 
                style={styles.settingsIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >

            {/* File Menu Modal */}
            <Modal
              visible={showFileMenu}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowFileMenu(false)}
            >
              <TouchableOpacity
                style={styles.fileMenuOverlay}
                activeOpacity={1}
                onPress={() => setShowFileMenu(false)}
              >
                <View style={styles.fileMenuContent}>
                  <Text style={styles.fileMenuTitle}>{selectedFile?.fileName}</Text>
                  
                  <TouchableOpacity
                    style={styles.fileMenuButton}
                    onPress={() => selectedFile && downloadFile(selectedFile)}
                  >
                    <Text style={styles.fileMenuButtonText}>📥 Tải xuống</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fileMenuButton}
                    onPress={() => selectedFile && saveImageToClipboard(selectedFile)}
                  >
                    <Text style={styles.fileMenuButtonText}>📤 Chia sẻ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fileMenuButton, styles.fileMenuButtonCancel]}
                    onPress={() => setShowFileMenu(false)}
                  >
                    <Text style={styles.fileMenuButtonTextCancel}>✕ Đóng</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Settings Modal */}
            <Modal
              visible={showSettingsModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowSettingsModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>⚙️ Cài đặt</Text>
                    <TouchableOpacity 
                      onPress={() => setShowSettingsModal(false)}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    {/* Username */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>👤 Tên người dùng</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="ChatNET User"
                        placeholderTextColor="#aaa"
                        maxLength={32}
                      />
                    </View>

                    {/* Auto-delete Messages */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>⏱️ Tự huỷ tin nhắn (giây)</Text>
                      <View style={styles.autoDeleteGrid}>
                        {[0, 5, 10, 30, 60].map(seconds => (
                          <TouchableOpacity
                            key={seconds}
                            style={[
                              styles.autoDeleteButton,
                              autoDeleteSeconds === seconds && styles.autoDeleteButtonActive
                            ]}
                            onPress={() => setAutoDeleteSeconds(seconds)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.autoDeleteButtonText,
                              autoDeleteSeconds === seconds && styles.autoDeleteButtonTextActive
                            ]}>
                              {seconds === 0 ? 'Tắt' : seconds + 's'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* My IP */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>📱 Địa chỉ IP của bạn</Text>
                      <View style={styles.ipDisplayRow}>
                        <Text style={styles.ipDisplayText}>{myIp}</Text>
                        <TouchableOpacity 
                          style={styles.reloadButton} 
                          onPress={fetchIpAddress}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.reloadIcon}>↻</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Target IP */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>🌐 IP người nhận</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={targetIp}
                        onChangeText={setTargetIp}
                        placeholder="Nhập IP (ví dụ: 192.168.1.100)"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                      />
                    </View>

                    {/* Encryption Toggle */}
                    <View style={styles.modalSection}>
                      <View style={styles.toggleRow}>
                        <View style={styles.toggleLabelContainer}>
                          <Text style={styles.modalLabel}>🔐 Chế độ mã hóa</Text>
                          <Text style={styles.toggleSubLabel}>
                            {isEncryptionEnabled ? 'Đang bật' : 'Đang tắt'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.toggleButton,
                            isEncryptionEnabled ? styles.toggleButtonOn : styles.toggleButtonOff
                          ]}
                          onPress={() => setIsEncryptionEnabled(!isEncryptionEnabled)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.toggleCircle,
                            isEncryptionEnabled ? styles.toggleCircleOn : styles.toggleCircleOff
                          ]} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Encryption Method Selector - Show when encryption is enabled */}
                    {isEncryptionEnabled && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>🔐 Phương pháp mã hóa</Text>
                        <View style={styles.methodGrid}>
                          {(['AES', 'DES', 'Caesar', 'RSA'] as const).map(method => (
                            <TouchableOpacity
                              key={method}
                              style={[
                                styles.methodButton,
                                encryptionMethod === method && styles.methodButtonActive
                              ]}
                              onPress={() => setEncryptionMethod(method)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.methodButtonText,
                                encryptionMethod === method && styles.methodButtonTextActive
                              ]}>
                                {method === 'AES' ? '🔒 AES' : method === 'DES' ? '🔐 DES' : method === 'Caesar' ? '📜 Caesar' : '🔑 RSA'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.infoBox}>
                          <Text style={styles.infoIcon}>ℹ️</Text>
                          <Text style={styles.infoText}>
                            {encryptionMethod === 'AES' && 'AES-256: Phương pháp mã hóa hiện đại, an toàn nhất. (Khuyến nghị)'}
                            {encryptionMethod === 'DES' && 'DES: Phương pháp cũ, yếu hơn. Chỉ sử dụng cho mục đích giáo dục.'}
                            {encryptionMethod === 'Caesar' && 'Caesar: Mã hóa cơ bản, không an toàn. Chỉ dùng cho học tập.'}
                            {encryptionMethod === 'RSA' && 'RSA: Mã hóa khóa công khai. Phiên bản đơn giản cho giáo dục.'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Caesar Shift Selector - Show only for Caesar method */}
                    {isEncryptionEnabled && encryptionMethod === 'Caesar' && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>📊 Caesar Shift (1-25)</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={caesarShift.toString()}
                          onChangeText={(text) => {
                            const num = parseInt(text) || 3;
                            if (num > 0 && num <= 25) setCaesarShift(num);
                          }}
                          placeholder="3"
                          placeholderTextColor="#aaa"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <View style={styles.infoBox}>
                          <Text style={styles.infoIcon}>ℹ️</Text>
                          <Text style={styles.infoText}>
                            Dịch chuyển: {caesarShift}. Cả 2 người phải sử dụng cùng giá trị shift.
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Encryption Key - Show when encryption is enabled, BUT NOT for Caesar */}
                    {isEncryptionEnabled && encryptionMethod !== 'Caesar' && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>
                          🔑 {encryptionMethod === 'AES' ? 'AES' : encryptionMethod === 'DES' ? 'DES' : 'RSA'} Key (1-16 ký tự)
                        </Text>
                        <TextInput
                          style={styles.modalInput}
                          value={encryptionKey}
                          onChangeText={setEncryptionKey}
                          placeholder="ChatNET1"
                          placeholderTextColor="#aaa"
                          maxLength={16}
                        />
                        <View style={styles.infoBox}>
                          <Text style={styles.infoIcon}>ℹ️</Text>
                          <Text style={styles.infoText}>
                            Key phải 1-16 ký tự. Cả 2 người phải dùng cùng key để chat được với nhau. ({encryptionMethod} Encryption)
                          </Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>

                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => setShowSettingsModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>✓ Lưu cài đặt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Messages Area */}
            <View style={styles.chatArea}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Vui lòng cài đặt trước khi trò chuyện</Text>
                  </View>
                ) : (
                  messages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.messageRow,
                        msg.sender === 'me' ? styles.myMessageRow : styles.otherMessageRow,
                      ]}
                    >
                      {msg.username && (
                        <Text style={[
                          styles.usernameLabel,
                          msg.sender === 'me' ? styles.myUsernameLabel : styles.otherUsernameLabel
                        ]}>
                          {msg.sender === 'me' ? 'Bạn' : msg.username}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.messageBubble,
                          msg.sender === 'me' ? styles.myMessage : styles.otherMessage,
                        ]}
                      >
                        {msg.file ? (
                          <View style={styles.fileContainer}>
                            {msg.file.type === 'image' && (
                              <TouchableOpacity
                                onLongPress={() => {
                                  if (msg.file) {
                                    setSelectedFile(msg.file);
                                    setShowFileMenu(true);
                                  }
                                }}
                                activeOpacity={0.9}
                              >
                                <Image
                                  source={{ uri: `data:${msg.file.mimeType};base64,${msg.file.fileContent}` }}
                                  style={styles.imageMessage}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            )}
                            <View style={styles.fileInfo}>
                              <Text style={styles.fileIcon}>📎</Text>
                              <View style={styles.fileDetails}>
                                <Text
                                  style={[
                                    styles.fileName,
                                    msg.sender === 'me' ? styles.myText : styles.otherText,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {msg.file.fileName}
                                </Text>
                                <Text
                                  style={[
                                    styles.fileSize,
                                    msg.sender === 'me' ? styles.myText : styles.otherText,
                                  ]}
                                >
                                  {fileHandler.formatFileSize(msg.file.fileSize)}
                                </Text>
                              </View>
                            </View>
                            {msg.isLoading && (
                              <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                  <View
                                    style={[
                                      styles.progressFill,
                                      { width: `${transferProgress}%` },
                                    ]}
                                  />
                                </View>
                                <Text style={styles.progressText}>{transferProgress}%</Text>
                              </View>
                            )}
                            {msg.isLoading && (
                              <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color="#fff" />
                              </View>
                            )}
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.messageText,
                              msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText,
                            ]}
                          >
                            {msg.text}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.timestamp,
                            msg.sender === 'me' ? styles.myTimestamp : styles.otherTimestamp,
                          ]}
                        >
                          {msg.timestamp.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {msg.encrypted && ' 🔒'}
                          {msg.autoDeleteIn && msg.autoDeleteIn > 0 && ' ⏲️'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* Recents Modal */}
            <Modal
              visible={showRecents}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowRecents(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>⏱️ File gần đây</Text>
                    <TouchableOpacity 
                      onPress={() => setShowRecents(false)}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    {fileHistoryManager.recents.length === 0 ? (
                      <Text style={styles.emptyRecentsText}>Chưa có file nào được gửi gần đây</Text>
                    ) : (
                      fileHistoryManager.recents.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.recentFileItem}
                          onPress={() => {
                            sendFile(item.fileData);
                            setShowRecents(false);
                          }}
                        >
                          <View style={styles.recentFileIcon}>
                            <Text style={styles.recentFileIconText}>
                              {item.fileData.type === 'image' ? '🖼️' : '📎'}
                            </Text>
                          </View>
                          <View style={styles.recentFileInfo}>
                            <Text style={styles.recentFileName} numberOfLines={1}>
                              {item.fileData.fileName}
                            </Text>
                            <Text style={styles.recentFileTime}>
                              {fileHistoryManager.formatRecentTime(item.sentAt)} • {fileHandler.formatFileSize(item.fileData.fileSize)}
                            </Text>
                          </View>
                          <Text style={styles.recentFileRecover}>→</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={pickImage}
                disabled={isSendingFile}
                activeOpacity={0.7}
              >
                <Text style={styles.attachButtonText}>📷</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                editable={!isSendingFile}
              />
              <TouchableOpacity
                style={styles.recentsButton}
                onPress={() => setShowRecents(true)}
                disabled={isSendingFile || fileHistoryManager.recents.length === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.recentsButtonText}>⏱️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} 
                onPress={sendMessage}
                activeOpacity={0.7}
                disabled={!message.trim() || isSendingFile}
              >
                <Image 
                  source={require('./assets/send-message.png')} 
                  style={styles.sendIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.50,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0084ff',
    paddingHorizontal: scale(15),
    paddingTop: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(45),
    paddingBottom: verticalScale(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsIcon: {
    width: moderateScale(26),
    height: moderateScale(26),
    tintColor: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: scale(5),
  },
  closeButtonText: {
    fontSize: responsiveFontSize(24),
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: moderateScale(20),
  },
  modalSection: {
    marginBottom: verticalScale(20),
  },
  modalLabel: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(8),
  },
  ipDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ipDisplayText: {
    flex: 1,
    fontSize: responsiveFontSize(15),
    fontWeight: '600',
    color: '#0084ff',
  },
  reloadButton: {
    backgroundColor: '#0084ff',
    borderRadius: moderateScale(17),
    width: moderateScale(34),
    height: moderateScale(34),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10),
  },
  reloadIcon: {
    fontSize: responsiveFontSize(20),
    color: '#fff',
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    fontSize: responsiveFontSize(15),
    color: '#333',
    backgroundColor: '#fafafa',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoIcon: {
    fontSize: responsiveFontSize(18),
    marginRight: scale(8),
  },
  infoText: {
    flex: 1,
    fontSize: responsiveFontSize(12),
    color: '#1565C0',
    lineHeight: responsiveFontSize(18),
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: moderateScale(16),
    margin: moderateScale(20),
    marginTop: 0,
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleSubLabel: {
    fontSize: responsiveFontSize(12),
    color: '#666',
    marginTop: verticalScale(2),
  },
  toggleButton: {
    width: moderateScale(56),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    padding: scale(2),
    justifyContent: 'center',
  },
  toggleButtonOn: {
    backgroundColor: '#4CAF50',
    alignItems: 'flex-end',
  },
  toggleButtonOff: {
    backgroundColor: '#ccc',
    alignItems: 'flex-start',
  },
  toggleCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  toggleCircleOn: {
  },
  toggleCircleOff: {
  },
  chatArea: {
    flex: 1,
    backgroundColor: 'rgba(240, 242, 245, 0.85)',
    marginBottom: 0,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: moderateScale(14),
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(50),
    paddingHorizontal: scale(20),
  },
  emptyText: {
    fontSize: responsiveFontSize(15),
    color: '#888',
    textAlign: 'center',
    lineHeight: responsiveFontSize(20),
  },
  messageRow: {
    marginVertical: verticalScale(4),
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  otherMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    padding: moderateScale(12),
    borderRadius: moderateScale(16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  myMessage: {
    backgroundColor: '#0084ff',
    borderBottomRightRadius: moderateScale(4),
  },
  otherMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: responsiveFontSize(15),
    marginBottom: verticalScale(3),
    lineHeight: responsiveFontSize(20),
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: responsiveFontSize(11),
    alignSelf: 'flex-end',
    marginTop: verticalScale(2),
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTimestamp: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: moderateScale(14),
    paddingBottom: verticalScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 0,
    alignItems: 'flex-end',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  attachButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  attachButtonText: {
    fontSize: responsiveFontSize(20),
  },
  messageInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: moderateScale(25),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    fontSize: responsiveFontSize(15),
    maxHeight: verticalScale(100),
    color: '#333',
    marginRight: scale(10),
    backgroundColor: '#fafafa',
  },
  sendButton: {
    backgroundColor: 'transparent',
    width: moderateScale(25),
    height: moderateScale(25),
    borderRadius: moderateScale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    width: moderateScale(25),
    height: moderateScale(25),
  },
  fileContainer: {
    minWidth: scale(200),
  },
  imageMessage: {
    width: scale(250),
    height: verticalScale(250),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: moderateScale(8),
  },
  fileIcon: {
    fontSize: responsiveFontSize(18),
    marginRight: scale(8),
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    marginBottom: verticalScale(2),
  },
  fileSize: {
    fontSize: responsiveFontSize(11),
  },
  myText: {
    color: '#fff',
  },
  otherText: {
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(12),
  },
  fileMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileMenuContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    width: SCREEN_WIDTH * 0.75,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fileMenuTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  fileMenuButton: {
    backgroundColor: '#0084ff',
    padding: moderateScale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(10),
    alignItems: 'center',
  },
  fileMenuButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(15),
    fontWeight: '600',
  },
  fileMenuButtonCancel: {
    backgroundColor: '#e0e0e0',
    marginBottom: 0,
  },
  fileMenuButtonTextCancel: {
    color: '#666',
    fontSize: responsiveFontSize(15),
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: verticalScale(10),
    width: '100%',
  },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: verticalScale(6),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(3),
  },
  progressText: {
    fontSize: responsiveFontSize(11),
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'right',
  },
  recentsButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  recentsButtonText: {
    fontSize: responsiveFontSize(18),
  },
  emptyRecentsText: {
    fontSize: responsiveFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: verticalScale(40),
  },
  recentFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    marginBottom: verticalScale(8),
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recentFileIcon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  recentFileIconText: {
    fontSize: responsiveFontSize(20),
  },
  recentFileInfo: {
    flex: 1,
  },
  recentFileName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(2),
  },
  recentFileTime: {
    fontSize: responsiveFontSize(12),
    color: '#999',
  },
  recentFileRecover: {
    fontSize: responsiveFontSize(16),
    color: '#0084ff',
    fontWeight: 'bold',
  },
  usernameLabel: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    marginBottom: verticalScale(3),
    marginHorizontal: scale(8),
  },
  myUsernameLabel: {
    color: '#666',
    textAlign: 'right',
  },
  otherUsernameLabel: {
    color: '#666',
    textAlign: 'left',
  },
  autoDeleteGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  autoDeleteButton: {
    flex: 1,
    minWidth: scale(50),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoDeleteButtonActive: {
    backgroundColor: '#0084ff',
    borderColor: '#0084ff',
  },
  autoDeleteButtonText: {
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    color: '#666',
  },
  autoDeleteButtonTextActive: {
    color: '#fff',
  },
  recentsButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  recentsButtonText: {
    fontSize: responsiveFontSize(20),
  },
  progressContainer: {
    marginTop: verticalScale(8),
  },
  progressBar: {
    height: verticalScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(2),
  },
  progressText: {
    fontSize: responsiveFontSize(10),
    color: '#fff',
    marginTop: verticalScale(2),
    textAlign: 'right',
  },
  emptyRecentsText: {
    fontSize: responsiveFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  recentFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentFileIcon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  recentFileIconText: {
    fontSize: responsiveFontSize(20),
  },
  recentFileInfo: {
    flex: 1,
  },
  recentFileName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(2),
  },
  recentFileTime: {
    fontSize: responsiveFontSize(12),
    color: '#999',
  },
  fileMenuButtonTextCancel: {
    color: '#666',
  },
  // Encryption method selector styles
  methodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
    gap: scale(8),
  },
  methodButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
  },
  methodButtonText: {
    fontSize: responsiveFontSize(12),
    color: '#333',
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;
