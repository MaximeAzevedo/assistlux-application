import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileImage, FileText, Download, X, AlertTriangle, CheckCircle, Loader2, Upload, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { heicTo, isHeic } from 'heic-to';

interface ConvertedFile {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: string;
  status: 'pending' | 'converting' | 'ready' | 'error';
  downloadUrl?: string;
  errorMessage?: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const FileConverter: React.FC = () => {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const { t } = useTranslation();

  // Formats supportés
  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/tiff', 'image/bmp'];

  // Fonction toast améliorée
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  // Fonction utilitaire pour formater la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Détection du type de fichier par extension
  const getFileTypeFromExtension = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension === 'heic' || extension === 'heif') {
      return 'image/heic';
    }
    return '';
  };

  // Conversion HEIC vers JPEG avec heic-to (la vraie solution!)
  const convertHeicToJpeg = async (file: File): Promise<Blob> => {
    try {
      showToast(`🔄 Conversion HEIC en cours: ${file.name}`, 'info');
      
      // Vérifier si c'est bien un fichier HEIC
      const isHeicFile = await isHeic(file);
      if (!isHeicFile) {
        throw new Error('Le fichier n\'est pas un vrai fichier HEIC');
      }

      // Conversion avec heic-to
      const jpegBlob = await heicTo({
        blob: file,
        type: 'image/jpeg',
        quality: 0.95  // Haute qualité
      });

      if (!jpegBlob) {
        throw new Error('Échec de la conversion HEIC');
      }

      showToast(`✅ HEIC converti: ${file.name}`, 'success');
      return jpegBlob;

    } catch (error) {
      console.error('Erreur conversion HEIC:', error);
      throw new Error(`Conversion HEIC échouée: ${error instanceof Error ? error.message : 'erreur inconnue'}`);
    }
  };

  // Fonction principale de conversion vers PDF
  const convertToPdf = async (file: File): Promise<string> => {
    try {
      // Import dynamique de jsPDF
      const { jsPDF } = await import('jspdf');
      
      let imageBlob: Blob;
      let imageName: string;

      // Vérifier si c'est un fichier HEIC et le convertir d'abord
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        imageBlob = await convertHeicToJpeg(file);
        imageName = file.name.replace(/\.heic?$/i, '.jpg');
        showToast(`📸 HEIC → JPEG: ${file.name}`, 'success');
      } else {
        imageBlob = file;
        imageName = file.name;
      }
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Créer un nouveau document PDF
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Calculer les dimensions pour s'adapter à la page
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;
            
            // Centrer l'image
            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;
            
            // Ajouter l'image au PDF
            pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
            
            // Générer le blob et créer l'URL de téléchargement
            const pdfBlob = pdf.output('blob');
            const downloadUrl = URL.createObjectURL(pdfBlob);
            
            resolve(downloadUrl);
          } catch (error) {
            reject(new Error(`Erreur génération PDF: ${error instanceof Error ? error.message : 'erreur inconnue'}`));
          }
        };
        
        img.onerror = () => reject(new Error('Impossible de charger l\'image pour la conversion PDF'));
        img.src = URL.createObjectURL(imageBlob);
      });
    } catch (error) {
      throw new Error(`Erreur lors de la conversion: ${error instanceof Error ? error.message : 'erreur inconnue'}`);
    }
  };

  // Validation améliorée des fichiers
  const validateFile = (file: File): { isValid: boolean; error?: string; isHeic?: boolean } => {
    // Vérifier la taille (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, error: 'Fichier trop volumineux (max 50MB)' };
    }

    // Vérifier le type MIME ou l'extension
    const fileType = file.type || getFileTypeFromExtension(file.name);
    const fileName = file.name.toLowerCase();

    // Fichiers HEIC/HEIF - maintenant supportés !
    if (fileType === 'image/heic' || fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      return { isValid: true, isHeic: true };
    }

    // Autres formats d'images supportés
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp', 'image/gif'];
    if (fileType.startsWith('image/') && supportedTypes.some(type => fileType.includes(type.split('/')[1]))) {
      return { isValid: true };
    }

    // Vérifier par extension si le MIME type n'est pas détecté
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'gif', 'heic', 'heif'];
    const extension = fileName.split('.').pop();
    
    if (extension && supportedExtensions.includes(extension)) {
      return { isValid: true, isHeic: extension === 'heic' || extension === 'heif' };
    }

    return { 
      isValid: false, 
      error: `Format non supporté: ${fileType || extension}. Formats acceptés: JPG, PNG, WEBP, TIFF, BMP, GIF, HEIC, HEIF` 
    };
  };

  // Gestion du drop de fichiers
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!rgpdAccepted) {
      showToast('❌ Veuillez accepter les conditions de confidentialité', 'error');
      return;
    }

    setIsConverting(true);
    
    // Valider et ajouter tous les fichiers avec le statut "pending"
    const validFiles: ConvertedFile[] = [];
    
    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        validFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          originalFile: file,
          originalName: file.name,
          originalSize: formatFileSize(file.size),
          status: 'pending'
        });
        
        if (validation.isHeic) {
          showToast(`🎉 Fichier HEIC détecté: ${file.name} - Conversion supportée!`, 'success');
        }
      } else {
        showToast(`❌ ${file.name}: ${validation.error}`, 'error');
      }
    }

    if (validFiles.length === 0) {
      setIsConverting(false);
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);

    // Convertir chaque fichier valide (y compris les HEIC!)
    for (const newFile of validFiles) {
      try {
        // Mettre à jour le statut
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'converting' } : f
        ));

        // Conversion vers PDF avec support HEIC
        showToast(`📄 Génération PDF: ${newFile.originalName}`, 'info');
        const downloadUrl = await convertToPdf(newFile.originalFile);

        // Mettre à jour avec le résultat
        setFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, status: 'ready', downloadUrl }
            : f
        ));

        showToast(`✅ PDF généré: ${newFile.originalName}`, 'success');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur de conversion inconnue';
        
        setFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, status: 'error', errorMessage }
            : f
        ));

        showToast(`❌ ${newFile.originalName}: ${errorMessage}`, 'error');
      }
    }

    setIsConverting(false);
  }, [rgpdAccepted, showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.tiff', '.bmp', '.gif', '.heic', '.heif']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // Fonction de téléchargement
  const handleDownload = (file: ConvertedFile) => {
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.originalName.replace(/\.[^/.]+$/i, '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Supprimer un fichier
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.downloadUrl) {
        URL.revokeObjectURL(fileToRemove.downloadUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Vider tous les fichiers
  const clearAll = () => {
    files.forEach(file => {
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
    });
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Premium */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform">
            <RefreshCw className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Convertisseur de Fichiers
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Convertissez vos images en PDF de manière sécurisée et locale. 
            <span className="font-semibold text-purple-600"> Support HEIC natif </span>
            • <span className="font-semibold text-pink-600"> 100% confidentiel </span>
            • <span className="font-semibold text-purple-600"> Aucun serveur </span>
          </p>
        </div>

        {/* Alerte RGPD Premium */}
        {!rgpdAccepted && (
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-purple-100/50 shadow-xl p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🔒 Protection Maximale des Données
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Protections Automatiques
                      </h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          Conversion 100% locale dans votre navigateur
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          Support HEIC natif avec heic-to v1.1.14
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          Aucun stockage permanent des fichiers
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-pink-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" />
                        Garanties RGPD
                      </h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          Aucun envoi vers des serveurs externes
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          Suppression automatique après téléchargement
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          Conformité européenne garantie
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setRgpdAccepted(true)}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <CheckCircle className="w-5 h-5" />
                    J'accepte - Démarrer la conversion locale
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zone de Drop Premium */}
        {rgpdAccepted && (
          <div className="mb-8">
            <div
              {...getRootProps()}
              className={`
                relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden
                ${isDragActive 
                  ? 'border-purple-400 bg-purple-50/50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/30'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {isDragActive 
                    ? "Déposez vos images ici..." 
                    : "Glissez vos images ou cliquez pour sélectionner"
                  }
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Formats supportés: JPEG, PNG, <span className="font-bold text-green-600">HEIC/HEIF</span>, WEBP, TIFF, BMP, GIF
                </p>
                
                {/* Badge HEIC */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-6">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">HEIC maintenant supporté nativement !</span>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Maximum 10 fichiers
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    50MB par fichier
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des Fichiers Premium */}
        {files.length > 0 && (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-100/50 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-600" />
                Fichiers à convertir ({files.length})
              </h3>
              <button
                onClick={clearAll}
                className="px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                Vider tout
              </button>
            </div>

            <div className="divide-y divide-gray-200/50">
              {files.map((file) => (
                <div key={file.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {file.originalName}
                          {(file.originalName.toLowerCase().endsWith('.heic') || file.originalName.toLowerCase().endsWith('.heif')) && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              HEIC ✅
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{file.originalSize}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Statut */}
                      {file.status === 'pending' && (
                        <span className="text-gray-500 text-sm font-medium">En attente...</span>
                      )}
                      {file.status === 'converting' && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium">Conversion...</span>
                        </div>
                      )}
                      {file.status === 'ready' && (
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <button
                            onClick={() => handleDownload(file)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger PDF
                          </button>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className="flex items-start gap-2 max-w-md">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-red-600 text-sm">
                            <p className="font-medium">{file.errorMessage}</p>
                          </div>
                        </div>
                      )}

                      {/* Bouton supprimer */}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toasts Premium */}
        <div className="fixed top-20 right-4 space-y-3 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                px-6 py-4 rounded-2xl shadow-xl max-w-sm transform transition-all duration-300 backdrop-blur-xl
                ${toast.type === 'success' ? 'bg-green-500/90 text-white' :
                  toast.type === 'error' ? 'bg-red-500/90 text-white' :
                  toast.type === 'warning' ? 'bg-yellow-500/90 text-white' :
                  'bg-blue-500/90 text-white'
                }
              `}
            >
              <p className="font-medium">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileConverter; 