import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  LinearProgress,
  Grid,
  Paper,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Description,
  AccountBalance,
  Person,
  Home,
  Work,
  Info,
  Security,
  SmartToy
} from '@mui/icons-material';

interface DocumentsStepProps {
  data: any;
  onChange: (data: any) => void;
  errors: any;
  session: any;
  onDocumentUpload?: (file: File, documentType: string) => Promise<any>;
  aiProcessing: boolean;
}

interface DocumentRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
  uploaded: boolean;
  aiProcessed?: boolean;
  confidence?: number;
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({
  data,
  onChange,
  errors,
  session,
  onDocumentUpload,
  aiProcessing
}) => {
  const { t } = useTranslation();
  
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, any>>(data.documents || {});
  const [finalValidation, setFinalValidation] = useState({
    declarationHonneur: data.declarationHonneur || false,
    autorisationTraitement: data.autorisationTraitement || false,
    confirmationExactitude: data.confirmationExactitude || false
  });

  const documentsRequis: DocumentRequirement[] = [
    {
      id: 'piece_identite',
      label: 'Pièce d\'identité',
      description: 'Carte d\'identité ou passeport en cours de validité',
      required: true,
      icon: <Person />,
      uploaded: !!uploadedDocuments.piece_identite
    },
    {
      id: 'rib',
      label: 'RIB bancaire',
      description: 'Relevé d\'identité bancaire pour le versement',
      required: true,
      icon: <AccountBalance />,
      uploaded: !!uploadedDocuments.rib
    },
    {
      id: 'justificatif_domicile',
      label: 'Justificatif de domicile',
      description: 'Facture récente (électricité, gaz, eau) ou quittance de loyer',
      required: true,
      icon: <Home />,
      uploaded: !!uploadedDocuments.justificatif_domicile
    },
    {
      id: 'justificatifs_revenus',
      label: 'Justificatifs de revenus',
      description: 'Fiches de paie, attestations Pôle emploi, pensions...',
      required: true,
      icon: <Work />,
      uploaded: !!uploadedDocuments.justificatifs_revenus
    },
    {
      id: 'composition_menage',
      label: 'Composition du ménage',
      description: 'Livret de famille, acte de naissance des enfants...',
      required: false,
      icon: <Description />,
      uploaded: !!uploadedDocuments.composition_menage
    }
  ];

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;

    setUploadingDocument(documentType);
    
    try {
      let result: any = { success: true, message: 'Document uploadé avec succès' };
      
      // Si IA activée et fonction d'upload fournie
      if (session?.consentements?.ia_externe && onDocumentUpload) {
        result = await onDocumentUpload(file, documentType);
      }
      
      // Enregistrer le document uploadé
      const newUploadedDocuments = {
        ...uploadedDocuments,
        [documentType]: {
          file: file,
          fileName: file.name,
          uploadedAt: new Date(),
          aiProcessed: !!result.extractedData,
          confidence: result.confidence || 0,
          extractedData: result.extractedData || null
        }
      };
      
      setUploadedDocuments(newUploadedDocuments);
      
      // Mettre à jour les données du formulaire
      onChange({
        ...data,
        documents: newUploadedDocuments
      });
      
    } catch (error: any) {
      console.error('Erreur upload document:', error);
      alert(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleValidationChange = (field: string, value: boolean) => {
    const newValidation = { ...finalValidation, [field]: value };
    setFinalValidation(newValidation);
    
    onChange({
      ...data,
      ...newValidation
    });
  };

  const getDocumentStatus = (doc: DocumentRequirement) => {
    if (doc.uploaded) {
      const uploadedDoc = uploadedDocuments[doc.id];
      if (uploadedDoc?.aiProcessed && uploadedDoc.confidence > 0.8) {
        return { color: 'success', label: '✅ Validé IA', icon: <SmartToy /> };
      }
      return { color: 'info', label: '📄 Uploadé', icon: <CheckCircle /> };
    }
    if (doc.required) {
      return { color: 'error', label: '❌ Requis', icon: <Error /> };
    }
    return { color: 'default', label: '⚪ Optionnel', icon: <Info /> };
  };

  const documentsRequiredUploaded = documentsRequis
    .filter(doc => doc.required)
    .every(doc => doc.uploaded);

  const allValidationsChecked = Object.values(finalValidation).every(Boolean);
  const canProceed = documentsRequiredUploaded && allValidationsChecked;

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudUpload />
        Documents et finalisation
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Uploadez les documents requis pour finaliser votre demande d'allocation de vie chère.
      </Typography>

      {/* Indicateur de progression */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Progression des documents
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Documents requis : {documentsRequis.filter(d => d.required && d.uploaded).length} / {documentsRequis.filter(d => d.required).length}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(documentsRequis.filter(d => d.required && d.uploaded).length / documentsRequis.filter(d => d.required).length) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          {session?.consentements?.ia_externe && (
            <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
              <Typography variant="body2">
                🤖 Assistant IA activé : vos documents seront analysés automatiquement pour pré-remplir les informations manquantes.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {documentsRequis.map((doc) => {
          const status = getDocumentStatus(doc);
          
          return (
            <Box key={doc.id} sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
              <Card 
                variant="outlined"
                sx={{ 
                  height: '100%',
                  border: doc.uploaded ? 2 : 1,
                  borderColor: doc.uploaded ? 'success.main' : 'divider'
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    {doc.icon}
                    <Box flexGrow={1}>
                      <Typography variant="h6">
                        {doc.label}
                        {doc.required && <span style={{ color: 'red' }}> *</span>}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doc.description}
                      </Typography>
                    </Box>
                    <Chip 
                      label={status.label}
                      color={status.color as any}
                      size="small"
                      icon={status.icon}
                    />
                  </Box>
                  
                  {doc.uploaded && uploadedDocuments[doc.id] && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        📄 {uploadedDocuments[doc.id].fileName}
                        <br />
                        ⏰ {uploadedDocuments[doc.id].uploadedAt.toLocaleString('fr-LU')}
                        {uploadedDocuments[doc.id].aiProcessed && (
                          <>
                            <br />
                            🤖 Analysé par IA (confiance: {(uploadedDocuments[doc.id].confidence * 100).toFixed(1)}%)
                          </>
                        )}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Button
                    variant={doc.uploaded ? "outlined" : "contained"}
                    component="label"
                    fullWidth
                    disabled={uploadingDocument === doc.id || aiProcessing}
                    startIcon={uploadingDocument === doc.id ? <LinearProgress /> : <CloudUpload />}
                  >
                    {uploadingDocument === doc.id 
                      ? 'Upload en cours...' 
                      : doc.uploaded 
                        ? 'Remplacer le document' 
                        : 'Choisir un fichier'
                    }
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, doc.id);
                      }}
                    />
                  </Button>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      {/* Validations finales */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            <Security sx={{ mr: 1 }} />
            Déclarations et validations finales
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={finalValidation.declarationHonneur}
                      onChange={(e) => handleValidationChange('declarationHonneur', e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItemIcon>
              <ListItemText
                primary="Déclaration sur l'honneur"
                secondary="Je certifie que toutes les informations fournies sont exactes et complètes. Je m'engage à signaler tout changement dans ma situation."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={finalValidation.autorisationTraitement}
                      onChange={(e) => handleValidationChange('autorisationTraitement', e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItemIcon>
              <ListItemText
                primary="Autorisation de traitement"
                secondary="J'autorise le Fonds national de solidarité à traiter mes données personnelles dans le cadre de cette demande, conformément au RGPD."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={finalValidation.confirmationExactitude}
                      onChange={(e) => handleValidationChange('confirmationExactitude', e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItemIcon>
              <ListItemText
                primary="Confirmation d'exactitude"
                secondary="Je confirme avoir vérifié l'exactitude de toutes les informations saisies et des documents fournis."
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Récapitulatif final */}
      <Paper sx={{ mt: 3, p: 3, bgcolor: canProceed ? 'success.light' : 'warning.light' }}>
        <Typography variant="h6" gutterBottom>
          {canProceed ? '✅ Prêt pour la soumission' : '⚠️ Éléments manquants'}
        </Typography>
        
        {!documentsRequiredUploaded && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              📄 Veuillez uploader tous les documents requis avant de continuer.
            </Typography>
          </Alert>
        )}
        
        {!allValidationsChecked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ✅ Veuillez cocher toutes les déclarations obligatoires.
            </Typography>
          </Alert>
        )}
        
        {canProceed && (
          <Alert severity="success">
            <Typography variant="body2">
              🎉 Votre dossier est complet ! Vous pouvez maintenant finaliser votre demande d'allocation de vie chère.
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentsStep; 