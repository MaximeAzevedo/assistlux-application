import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2, Eye, X, Shield, AlertTriangle } from 'lucide-react';
import DocumentScannerService, { DocumentScanResult } from '../../services/DocumentScannerService';

interface SmartDocumentUploadProps {
  expectedDocumentType: string;
  documentName: string;
  onDataExtracted: (data: Record<string, any>) => void;
  onValidationComplete: (isValid: boolean, result: DocumentScanResult) => void;
  className?: string;
}

const SmartDocumentUpload: React.FC<SmartDocumentUploadProps> = ({
  expectedDocumentType,
  documentName,
  onDataExtracted,
  onValidationComplete,
  className = ''
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rgpdAcknowledged, setRgpdAcknowledged] = useState(false);

  const documentScanner = DocumentScannerService.getInstance();

  const handleRgpdAcknowledgment = useCallback(() => {
    setRgpdAcknowledged(true);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    if (!rgpdAcknowledged) {
      alert("Veuillez d'abord accepter les conditions de protection des données.");
      return;
    }

    setUploadedFile(file);
    setIsScanning(true);
    setScanResult(null);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    try {
      console.log(`🚀 Début du scan avec anonymisation RGPD pour: ${documentName}`);
      
      const result = await documentScanner.scanDocumentForLogement(file, expectedDocumentType);
      
      console.log('📊 Résultat du scan anonymisé:', result);
      setScanResult(result);

      onValidationComplete(result.isValid, result);

      if (result.formFieldMappings && Object.keys(result.formFieldMappings).length > 0) {
        console.log('📝 Données extraites (post-anonymisation) pour le formulaire:', result.formFieldMappings);
        onDataExtracted(result.formFieldMappings);
      }

    } catch (error) {
      console.error('❌ Erreur lors du scan:', error);
      setScanResult({
        isValid: false,
        confidence: 0,
        documentType: 'unknown',
        extractedData: {},
        suggestions: [],
        errors: ['Erreur lors de l\'analyse du document'],
        formFieldMappings: {},
        wasAnonymized: false
      });
    } finally {
      setIsScanning(false);
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [expectedDocumentType, documentName, onDataExtracted, onValidationComplete, rgpdAcknowledged, previewUrl]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const getStatusIcon = () => {
    if (isScanning) {
      return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
    }
    if (scanResult?.isValid) {
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    }
    if (scanResult && !scanResult.isValid) {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    return <Upload className="w-6 h-6 text-gray-400" />;
  };

  const getStatusMessage = () => {
    if (isScanning) {
      return "🔍 Analyse sécurisée en cours (données anonymisées)...";
    }
    if (scanResult?.isValid) {
      const anonymizedText = scanResult.wasAnonymized ? " (données anonymisées)" : "";
      return `✅ Document validé${anonymizedText} (${Math.round(scanResult.confidence * 100)}% de confiance)`;
    }
    if (scanResult && !scanResult.isValid) {
      return `❌ Document non valide (${Math.round(scanResult.confidence * 100)}% de confiance)`;
    }
    return `📄 Glissez votre ${documentName.toLowerCase()} ici ou cliquez pour sélectionner`;
  };

  const getExtractedDataSummary = () => {
    if (!scanResult?.formFieldMappings) return null;

    const mappings = scanResult.formFieldMappings;
    const keys = Object.keys(mappings);
    
    if (keys.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <h4 className="font-medium text-blue-900">📝 Données extraites automatiquement</h4>
          {scanResult.wasAnonymized && (
            <div className="ml-2 flex items-center text-xs text-green-600">
              <Shield className="w-3 h-3 mr-1" />
              Anonymisé
            </div>
          )}
        </div>
        <div className="space-y-1 text-sm">
          {keys.map(key => (
            <div key={key} className="flex justify-between">
              <span className="text-blue-700 capitalize">{key.replace('_', ' ')} :</span>
              <span className="text-blue-900 font-medium">{mappings[key]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Ces informations ont été automatiquement ajoutées à votre formulaire
        </p>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!rgpdAcknowledged && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 mb-2">
                ⚠️ Protection des données personnelles
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                <strong>Ne scannez pas de documents contenant des informations personnelles si non nécessaire.</strong>
              </p>
              <div className="text-xs text-amber-600 space-y-1">
                <p>• Les documents sont automatiquement anonymisés avant traitement IA</p>
                <p>• Toutes les données temporaires sont effacées immédiatement après analyse</p>
                <p>• Aucune donnée personnelle n'est conservée ou transmise à des tiers</p>
              </div>
              <button
                onClick={handleRgpdAcknowledgment}
                className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
              >
                J'ai compris et j'accepte
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        onDrop={rgpdAcknowledged ? handleDrop : undefined}
        onDragOver={rgpdAcknowledged ? (e) => e.preventDefault() : undefined}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${!rgpdAcknowledged ? 'opacity-50 pointer-events-none' : ''}
          ${isScanning ? 'border-blue-300 bg-blue-50' : ''}
          ${scanResult?.isValid ? 'border-green-300 bg-green-50' : ''}
          ${scanResult && !scanResult.isValid ? 'border-red-300 bg-red-50' : ''}
          ${!scanResult && !isScanning && rgpdAcknowledged ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer' : ''}
        `}
      >
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isScanning || !rgpdAcknowledged}
        />
        
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {getStatusMessage()}
            </p>
            {uploadedFile && (
              <p className="text-xs text-gray-500 mt-1">
                Fichier : {uploadedFile.name}
              </p>
            )}
          </div>

          {!isScanning && !uploadedFile && rgpdAcknowledged && (
            <p className="text-xs text-gray-500">
              Formats acceptés : JPG, PNG, PDF (max 10MB)
            </p>
          )}

          {rgpdAcknowledged && (
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <Shield className="w-3 h-3 mr-1" />
              Protection RGPD activée
            </div>
          )}
        </div>
      </div>

      {scanResult && (
        <div className="space-y-3">
          {scanResult.wasAnonymized && (
            <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">
              <Shield className="w-4 h-4 mr-2" />
              Document traité avec anonymisation automatique des données personnelles
            </div>
          )}

          {getExtractedDataSummary()}

          {scanResult.suggestions && scanResult.suggestions.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">💡 Suggestions d'amélioration :</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                {scanResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scanResult.errors && scanResult.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">❌ Erreurs détectées :</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {scanResult.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {previewUrl && (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Voir l'aperçu du document
            </button>
          )}
        </div>
      )}

      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Aperçu du document</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewUrl}
                alt="Aperçu du document"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDocumentUpload; 