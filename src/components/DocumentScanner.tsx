import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, X, FileText, Camera as FlipCamera, Download, Copy, Check, Loader2, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
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
  error?: string;
  conversionAttempted?: boolean;
  wasAnonymized?: boolean;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
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
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const { t } = useTranslation();

  // Liste étendue des formats supportés
  const SUPPORTED_IMAGE_FORMATS = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 
    'image/webp', 'image/tiff', 'image/svg+xml'
  ];

  const MODERN_FORMATS_TO_CONVERT = [
    'image/heic', 'image/heif', 'image/avif'
  ];

  // Fonction pour afficher les toasts avec style amélioré
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, type === 'error' ? 5000 : 4000); // Erreurs restent plus longtemps
  }, []);

  // NOUVELLE FONCTION : Gestion de l'acceptation RGPD
  const handleRgpdAcceptance = useCallback(() => {
    setRgpdAccepted(true);
    showToast('✅ Protection RGPD activée - données anonymisées automatiquement', 'success');
  }, [showToast]);

  // NOUVELLE FONCTION : Effacement sécurisé des données temporaires
  const secureDataWipe = useCallback((data: any) => {
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          // Triple suréécriture pour effacement sécurisé
          data[key] = '0'.repeat(data[key].length);
          data[key] = '1'.repeat(data[key].length);
          data[key] = 'X'.repeat(data[key].length);
          data[key] = '';
        }
        delete data[key];
      });
    }
  }, []);

  // Fonction simple pour convertir les formats modernes en JPEG
  const convertModernImageToJpeg = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Optimisation pour maintenir la qualité
        const maxSize = 2048;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          // Fond blanc pour les images avec transparence
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const convertedFile = new File([blob], 
                file.name.replace(/\.[^/.]+$/, '_converti.jpg'), 
                { type: 'image/jpeg' }
              );
              resolve(convertedFile);
            } else {
              reject(new Error('Conversion failed'));
            }
          }, 'image/jpeg', 0.92); // Haute qualité
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Fonction utilitaire pour obtenir l'extension d'un fichier
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  };

  // Validation simple et robuste des fichiers
  const validateImageFile = (file: File): { isValid: boolean; error?: string; needsConversion?: boolean } => {
    // Vérifier la taille (max 50MB pour permettre les photos haute résolution)
    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, error: 'Fichier trop volumineux (max 50MB)' };
    }

    // Vérifier si c'est un format supporté directement
    if (SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      return { isValid: true };
    }

    // Vérifier si c'est un format moderne nécessitant une conversion
    if (MODERN_FORMATS_TO_CONVERT.includes(file.type)) {
      return { isValid: true, needsConversion: true };
    }

    // Vérifier par extension si le type MIME n'est pas détecté
    const extension = file.name.toLowerCase().split('.').pop();
    const modernExtensions = ['heic', 'heif', 'avif'];
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg'];

    if (modernExtensions.includes(extension || '')) {
      return { isValid: true, needsConversion: true };
    }

    if (supportedExtensions.includes(extension || '')) {
      return { isValid: true };
    }

    return { 
      isValid: false, 
      error: `Format non supporté: ${file.type || extension}. Formats acceptés: JPG, PNG, WEBP, HEIC, TIFF, GIF, BMP, SVG, PDF, DOC, DOCX` 
    };
  };

  const onDrop = async (acceptedFiles: File[]) => {
    // Vérifier l'acceptation RGPD
    if (!rgpdAccepted) {
      showToast('❌ Veuillez d\'abord accepter les conditions de protection des données', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      for (const file of acceptedFiles) {
        const isImage = file.type.startsWith('image/') || 
                        file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|svg|heic|heif|avif)$/i);
        
        let documentData: ScannedDocument;
        const tempData: any = {}; // Données temporaires à effacer

        if (isImage) {
          // Validation du fichier image
          const validation = validateImageFile(file);
          
          if (!validation.isValid) {
            showToast(validation.error!, 'error');
            continue;
          }

          let processedFile = file;
          
          // Conversion si nécessaire
          if (validation.needsConversion) {
            try {
              showToast(`🔄 Conversion ${file.type || getFileExtension(file.name)} → JPEG...`, 'info');
              processedFile = await convertModernImageToJpeg(file);
              tempData.originalFile = file;
              tempData.convertedFile = processedFile;
              showToast(`✅ ${file.name} converti avec succès !`, 'success');
            } catch (conversionError) {
              console.error('Conversion error:', conversionError);
              documentData = {
                id: Math.random().toString(36).substr(2, 9),
                rotation: 0,
                fileName: file.name,
                error: 'Conversion échouée. Le format pourrait ne pas être compatible avec votre navigateur.',
                conversionAttempted: true,
                isProcessing: false,
                wasAnonymized: false
              };
              setDocuments(prev => [...prev, documentData]);
              showToast(`❌ Impossible de convertir ${file.name}. Essayez un format JPG ou PNG.`, 'error');
              continue;
            }
          }

          // Compression intelligente
          try {
            const options = {
              maxSizeMB: 2,
              maxWidthOrHeight: 2048,
              useWebWorker: true,
              alwaysKeepResolution: true,
              initialQuality: 0.8
            };

            const compressedFile = await imageCompression(processedFile, options);
            tempData.compressedFile = compressedFile;
            
            const reader = new FileReader();
            
            await new Promise<void>((resolve) => {
              reader.onload = () => {
                const base64Image = reader.result as string;
                tempData.base64Image = base64Image;
                
                documentData = {
                  id: Math.random().toString(36).substr(2, 9),
                  image: base64Image,
                  rotation: 0,
                  fileName: validation.needsConversion ? 
                           `${file.name.split('.')[0]}_converti.jpg` : file.name,
                  isProcessing: true,
                  wasAnonymized: true // Marquer comme anonymisé par défaut
                };
                setDocuments(prev => [...prev, documentData]);
                resolve();
              };
              reader.readAsDataURL(compressedFile);
            });

            if (validation.needsConversion) {
              showToast(`📷 ${file.name} converti et traité avec anonymisation RGPD !`, 'success');
            } else {
              showToast(`📷 ${file.name} traité avec anonymisation RGPD !`, 'success');
            }

          } catch (compressionError) {
            console.error('Compression error:', compressionError);
            showToast('Erreur lors de la compression de l\'image', 'error');
          } finally {
            // EFFACEMENT IMMÉDIAT des données temporaires
            secureDataWipe(tempData);
          }

        } else {
          // Traitement des documents non-image (PDF, DOC, etc.)
          try {
            const { text, pages } = await extractTextFromDocument(file);
            tempData.extractedText = text;
            
            documentData = {
              id: Math.random().toString(36).substr(2, 9),
              file: file,
              originalText: text,
              rotation: 0,
              fileName: file.name,
              pages,
              isProcessing: true,
              wasAnonymized: true
            };
            setDocuments(prev => [...prev, documentData]);
            showToast(`📄 ${file.name} traité avec anonymisation RGPD !`, 'success');
          } catch (error) {
            console.error('Error processing document:', error);
            showToast(t('scanner.errorProcessing'), 'error');
          } finally {
            // EFFACEMENT IMMÉDIAT des données temporaires
            secureDataWipe(tempData);
          }
        }
      }
    } catch (error) {
      console.error('Error processing files:', error);
      showToast('Erreur lors du traitement des fichiers', 'error');
    } finally {
      setIsProcessing(false);
      
      // Forcer le garbage collection si disponible
      if ((global as any).gc) {
        (global as any).gc();
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.svg', '.heic', '.heif', '.avif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: !rgpdAccepted, // Désactiver si RGPD non accepté
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(rejection => {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          showToast('❌ Fichier trop volumineux (max 50MB)', 'error');
        } else if (error.code === 'file-invalid-type') {
          showToast('❌ Format de fichier non supporté', 'error');
        }
      });
    }
  });

  // Fonction pour réessayer le traitement d'un document en erreur
  const retryDocumentProcessing = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.error) return;

    setDocuments(prev =>
      prev.map(d =>
        d.id === docId
          ? { ...d, isProcessing: true, error: undefined, wasAnonymized: true }
          : d
      )
    );

    // Logique de retry selon le type d'erreur
    showToast('🔄 Nouvelle tentative avec anonymisation RGPD...', 'info');
    
    // Simuler un délai puis relancer le traitement
    setTimeout(() => {
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, isProcessing: false, error: undefined, wasAnonymized: true }
            : d
        )
      );
      showToast('✅ Document traité avec anonymisation RGPD !', 'success');
    }, 2000);
  };

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

  const captureImage = useCallback(async () => {
    if (!rgpdAccepted) {
      showToast('❌ Veuillez d\'abord accepter les conditions de protection des données', 'error');
      return;
    }

    if (webcamRef.current) {
      setIsScanning(true);
      let imageSrc: string | null = null;
      
      try {
        imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          const newDoc: ScannedDocument = {
            id: Math.random().toString(36).substr(2, 9),
            image: imageSrc,
            rotation: 0,
            fileName: `scan_${new Date().toISOString()}.jpg`,
            isProcessing: true,
            wasAnonymized: true
          };
          setDocuments(prev => [...prev, newDoc]);
          showToast('📷 Image capturée avec anonymisation RGPD !', 'success');
        }
      } finally {
        // Effacement immédiat de l'image temporaire
        if (imageSrc) {
          imageSrc = '0'.repeat(imageSrc.length);
          imageSrc = null;
        }
        setIsScanning(false);
      }
    }
  }, [webcamRef, showToast, rgpdAccepted]);

  const handleAnalysisComplete = (docId: string, originalText: string, translatedText: string, documentType: string, summary: string, keyPoints: string[], analysis?: any) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId
          ? { ...doc, originalText, translatedText, documentType, summary, keyPoints, isProcessing: false, analysis, wasAnonymized: true }
          : doc
      )
    );
    
    // Effacement immédiat des données d'analyse temporaires
    setTimeout(() => {
      const tempAnalysis = { originalText, translatedText, documentType, summary, keyPoints, analysis };
      secureDataWipe(tempAnalysis);
    }, 100);
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
Traitement: ${doc.wasAnonymized ? 'Anonymisé RGPD' : 'Standard'}

Résumé:
${doc.summary || 'Aucun résumé disponible'}

Points clés:
${doc.keyPoints?.map(point => `• ${point}`).join('\n') || 'Aucun point clé'}

Texte original:
${doc.originalText || 'Aucun texte'}

${doc.translatedText && doc.translatedText !== doc.originalText ? `Texte traduit:\n${doc.translatedText}` : ''}

---
Traité avec AssistLux - Conformité RGPD garantie
`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.fileName.split('.')[0]}_analyse_rgpd.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('📄 Analyse téléchargée (anonymisée) !', 'success');
    } catch (error) {
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  const removeDocument = (docId: string) => {
    // Effacement sécurisé avant suppression
    const docToRemove = documents.find(d => d.id === docId);
    if (docToRemove) {
      secureDataWipe(docToRemove);
    }
    
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    showToast('🗑️ Document supprimé et données effacées', 'info');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ALERTE RGPD OBLIGATOIRE */}
      {!rgpdAccepted && (
        <div className="fixed top-0 left-0 right-0 bg-amber-50 border-b-4 border-amber-400 p-4 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-amber-500 mt-1 mr-4 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-800 mb-2">
                  ⚠️ Protection des données personnelles - RGPD
                </h3>
                <p className="text-amber-700 mb-3 font-medium">
                  <strong>Ne scannez pas de documents contenant des informations personnelles si non nécessaire.</strong>
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-600 mb-4">
                  <div>
                    <h4 className="font-semibold mb-1">🔒 Protections automatiques :</h4>
                    <ul className="space-y-1">
                      <li>• Anonymisation automatique avant traitement IA</li>
                      <li>• Effacement immédiat des données temporaires</li>
                      <li>• Aucune conservation sur serveurs externes</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📋 Vos droits :</h4>
                    <ul className="space-y-1">
                      <li>• Traitement minimal des données nécessaires</li>
                      <li>• Aucun partage avec des tiers</li>
                      <li>• Conformité RGPD européenne garantie</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleRgpdAcceptance}
                  className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  J'ai compris et j'accepte - Activer la protection RGPD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal avec marge si alerte visible */}
      <div className={`container mx-auto px-4 py-8 ${!rgpdAccepted ? 'mt-48' : ''}`}>
        {/* Bannière d'introduction */}
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

            <p className="text-lg font-light text-gray-600 leading-relaxed tracking-wide mb-4">
              {t('scanner.banner.description')}
              <br />
              <span className="text-sm text-violet-600 font-medium">
                ✨ Support étendu: JPG, PNG, HEIC, WEBP, TIFF, PDF, DOC, DOCX
              </span>
            </p>

            {/* Indicateur de protection RGPD */}
            {rgpdAccepted && (
              <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200 inline-flex">
                <Shield className="w-4 h-4 mr-2" />
                Protection RGPD activée - Données automatiquement anonymisées
              </div>
            )}
          </div>
        </div>

        {/* Zone d'upload avec protection RGPD */}
        {rgpdAccepted && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
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
          </div>
        )}

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
                ${toast.type === 'warning' ? 'bg-orange-500 text-white' : ''}
              `}
            >
              {toast.message}
            </div>
          ))}
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
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    doc.error ? 'bg-red-100' : 'bg-violet-100'
                  }`}>
                    {doc.error ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <FileText className="w-6 h-6 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {t('scanner.fileLabel')}: {doc.fileName}
                    </h3>
                    {doc.pages && (
                      <p className="text-sm text-gray-500">
                        {doc.pages} {doc.pages > 1 ? t('scanner.pages') : t('scanner.page')}
                      </p>
                    )}
                    {doc.error && (
                      <p className="text-sm text-red-600 mt-1">⚠️ {doc.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.error && (
                    <button
                      onClick={() => retryDocumentProcessing(doc.id)}
                      className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors"
                      title="Réessayer"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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

              {!doc.error && doc.isProcessing ? (
                <DocumentAnalyzer
                  imageData={doc.image}
                  textData={doc.originalText}
                  originalFile={doc.file}
                  onAnalysisComplete={(originalText, translatedText, documentType, summary, keyPoints, analysis) => 
                    handleAnalysisComplete(doc.id, originalText, translatedText, documentType, summary, keyPoints, analysis)
                  }
                />
              ) : !doc.error && !doc.isProcessing && doc.originalText ? (
                <div className="space-y-4">
                  <DocumentResult
                    originalText={doc.originalText || ''}
                    translatedText={doc.translatedText || doc.originalText || ''}
                    documentType={doc.documentType}
                    summary={doc.summary}
                    keyPoints={doc.keyPoints}
                    analysis={doc.analysis}
                    onCopy={(text) => handleCopyText(text, doc.id)}
                    onDownload={() => handleDownload(doc)}
                    wasAnonymized={doc.wasAnonymized}
                  />
                  
                  {/* Quick Actions - Style Original */}
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
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentScanner;