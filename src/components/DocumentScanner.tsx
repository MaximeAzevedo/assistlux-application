import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, X, FileText, Camera as FlipCamera, Download, Copy, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DocumentAnalyzer from './DocumentScanner/DocumentAnalyzer';
import DocumentResult from './DocumentScanner/DocumentResult';
import { extractTextFromDocument } from '../lib/documentProcessing';

interface ScannedDocument {
  id: string;
  image?: string;
  file?: File;
  originalText?: string;
  translatedText?: string;
  documentType?: string;
  summary?: string;
  keyPoints?: string[];
  rotation: number;
  fileName: string;
  pages?: number;
  isProcessing?: boolean;
  analysis?: any;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const DocumentScanner: React.FC = () => {
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const { t } = useTranslation();

  // Fonction pour afficher les toasts
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    try {
      for (const file of acceptedFiles) {
        const isImage = file.type.startsWith('image/');
        let documentData: ScannedDocument;

        if (isImage) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          };

          const compressedFile = await imageCompression(file, options);
          const reader = new FileReader();
          
          await new Promise<void>((resolve) => {
            reader.onload = () => {
              const base64Image = reader.result as string;
              documentData = {
                id: Math.random().toString(36).substr(2, 9),
                image: base64Image,
                rotation: 0,
                fileName: file.name,
                isProcessing: true
              };
              setDocuments(prev => [...prev, documentData]);
              resolve();
            };
            reader.readAsDataURL(compressedFile);
          });
        } else {
          try {
            const { text, pages } = await extractTextFromDocument(file);
            documentData = {
              id: Math.random().toString(36).substr(2, 9),
              file: file,
              originalText: text,
              rotation: 0,
              fileName: file.name,
              pages,
              isProcessing: true
            };
            setDocuments(prev => [...prev, documentData]);
          } catch (error) {
            console.error('Error processing document:', error);
            showToast(t('scanner.errorProcessing'), 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error processing files:', error);
      showToast(t('scanner.uploadError'), 'error');
    }
    setIsProcessing(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleCameraToggle = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setCameraError(null);

    if (isCameraActive) {
      setIsCameraActive(false);
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsCameraActive(true);
    }
  };

  const captureImage = React.useCallback(async () => {
    if (webcamRef.current) {
      setIsScanning(true);
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const newDoc: ScannedDocument = {
          id: Math.random().toString(36).substr(2, 9),
          image: imageSrc,
          rotation: 0,
          fileName: `scan_${new Date().toISOString()}.jpg`,
          isProcessing: true
        };
        setDocuments(prev => [...prev, newDoc]);
        showToast(t('scanner.imageCaptured'), 'success');
      }
      setIsScanning(false);
    }
  }, [webcamRef, showToast, t]);

  const handleAnalysisComplete = (docId: string, originalText: string, translatedText: string, documentType: string, summary: string, keyPoints: string[], analysis?: any) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId
          ? { ...doc, originalText, translatedText, documentType, summary, keyPoints, isProcessing: false, analysis }
          : doc
      )
    );
  };

  const handleCopyText = async (text: string, docId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (docId) {
        setCopiedId(docId);
        setTimeout(() => setCopiedId(null), 2000);
      }
      showToast(t('scanner.textCopied'), 'success');
    } catch (error) {
      showToast(t('scanner.copyError'), 'error');
    }
  };

  const handleDownload = (doc: ScannedDocument) => {
    try {
      const content = `
Document: ${doc.fileName}
Type: ${doc.documentType || 'N/A'}

Résumé:
${doc.summary || 'Aucun résumé disponible'}

Points clés:
${doc.keyPoints?.map(point => `• ${point}`).join('\n') || 'Aucun point clé'}

Texte original:
${doc.originalText || 'Aucun texte'}

${doc.translatedText && doc.translatedText !== doc.originalText ? `Texte traduit:\n${doc.translatedText}` : ''}
`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.fileName.split('.')[0]}_analyse.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(t('scanner.downloadSuccess'), 'success');
    } catch (error) {
      showToast(t('scanner.downloadError'), 'error');
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    let errorMessage = t('scanner.error');

    if (error.name === 'NotAllowedError') {
      errorMessage = t('scanner.cameraPermissionDenied');
    } else if (error.name === 'NotFoundError') {
      errorMessage = t('scanner.cameraNotFound');
    } else if (error.name === 'NotReadableError') {
      errorMessage = t('scanner.cameraInUse');
    } else if (error.name === 'OverconstrainedError') {
      setFacingMode(facingMode === 'user' ? 'environment' : 'user');
      errorMessage = t('scanner.cameraConstraints');
    }

    setCameraError(errorMessage);
    if (error.name !== 'OverconstrainedError') {
      setIsCameraActive(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300
              ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100/50 p-12 py-14 mb-8 animate-fadeIn relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="mb-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('scanner.banner.title')}
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {t('scanner.banner.tagline')}
            </div>
          </h1>

          <p className="text-lg font-light text-gray-600 leading-relaxed tracking-wide mb-10">
            {t('scanner.banner.description')}
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mb-10">
            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className="relative bg-gradient-to-r from-purple-600 via-primary to-pink-600 text-white rounded-full py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <Camera className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{t('scanner.capture')}</span>
            </button>
            
            <div
              {...getRootProps()}
              className={`
                border-2 border-gray-300 hover:border-violet-300 hover:bg-violet-50/50 
                text-gray-700 rounded-full py-4 px-8 transition-all duration-300 
                flex items-center justify-center cursor-pointer transform hover:scale-105 hover:shadow-lg
                ${isDragActive ? 'border-violet-500 bg-violet-100' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-5 h-5 mr-2" />
              <span>{isDragActive ? t('scanner.dropFiles') : t('scanner.importFile')}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
              <span className="text-violet-600">🔒</span>
            </div>
            <p className="text-sm text-gray-600 italic leading-relaxed">
              {t('scanner.banner.privacy')}
            </p>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/10 via-fuchsia-200/5 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/10 via-violet-200/5 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
      </div>

      {isCameraActive && (
        <div className="relative mb-8 bg-black rounded-xl overflow-hidden">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full"
            videoConstraints={{
              facingMode
            }}
            onUserMediaError={handleCameraError}
          />
          
          {/* Camera Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleCameraToggle}
              className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
              title={t('scanner.flipCamera')}
            >
              <FlipCamera className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCameraActive(false)}
              className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
              title={t('scanner.closeCamera')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={captureImage}
            disabled={isScanning}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-violet-500 text-white rounded-full hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('scanner.capturing')}
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                {t('scanner.capture')}
              </>
            )}
          </button>
        </div>
      )}

      {cameraError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{cameraError}</p>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('scanner.processing')}</p>
        </div>
      )}

      <div className="space-y-6">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {t('scanner.fileLabel')}: {doc.fileName}
                  </h3>
                  {doc.pages && (
                    <p className="text-sm text-gray-500">{doc.pages} page{doc.pages > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeDocument(doc.id)}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {doc.image && (
              <div className="relative mb-6">
                <img
                  src={doc.image}
                  alt={doc.fileName}
                  style={{ transform: `rotate(${doc.rotation}deg)` }}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {doc.isProcessing ? (
              <DocumentAnalyzer
                imageData={doc.image}
                textData={doc.originalText}
                onAnalysisComplete={(originalText, translatedText, documentType, summary, keyPoints, analysis) => 
                  handleAnalysisComplete(doc.id, originalText, translatedText, documentType, summary, keyPoints, analysis)
                }
              />
            ) : (
              <div className="space-y-4">
                <DocumentResult
                  originalText={doc.originalText || ''}
                  translatedText={doc.translatedText || doc.originalText || ''}
                  documentType={doc.documentType}
                  summary={doc.summary}
                  keyPoints={doc.keyPoints}
                  analysis={doc.analysis}
                  onCopy={handleCopyText}
                  onDownload={() => handleDownload(doc)}
                />
                
                {/* Quick Actions */}
                {doc.summary && (
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleCopyText(doc.summary || '', doc.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copiedId === doc.id ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">{t('scanner.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t('scanner.copySummary')}</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('scanner.downloadReport')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentScanner;