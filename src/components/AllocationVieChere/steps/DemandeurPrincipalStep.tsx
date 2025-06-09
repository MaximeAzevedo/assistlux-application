import React, { useState } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Upload,
  SmartToy,
  CheckCircle,
  Error,
  Info,
  Help,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

interface DemandeurPrincipalStepProps {
  data: any;
  onChange: (data: any) => void;
  errors: any;
  session: any;
  onDocumentUpload: (file: File, documentType: string) => Promise<any>;
  aiProcessing: boolean;
}

const DemandeurPrincipalStep: React.FC<DemandeurPrincipalStepProps> = ({
  data = {},
  onChange,
  errors = {},
  session,
  onDocumentUpload,
  aiProcessing
}) => {
  const [showMatriculeHelp, setShowMatriculeHelp] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const handleInputChange = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setDocumentUploading(true);
      const result = await onDocumentUpload(file, documentType);
      
      setUploadResults(prev => [...prev, {
        fileName: file.name,
        documentType,
        result,
        timestamp: new Date()
      }]);

      // Pré-remplir les champs si l'IA a extrait des données
      if (result.success && result.extractedData) {
        const updates: any = {};
        
        if (result.extractedData.nom) updates.nom = result.extractedData.nom;
        if (result.extractedData.prenom) updates.prenom = result.extractedData.prenom;
        if (result.extractedData.matricule) updates.matricule = result.extractedData.matricule;
        if (result.extractedData.date_naissance) updates.date_naissance = result.extractedData.date_naissance;
        if (result.extractedData.adresse) {
          // Parser l'adresse complète
          const adresseComplete = result.extractedData.adresse;
          const adresseRegex = /^(.+?)\s+(L-\d{4})\s+(.+)$/;
          const match = adresseComplete.match(adresseRegex);
          
          if (match) {
            updates.adresse_rue = match[1];
            updates.adresse_code_postal = match[2];
            updates.adresse_commune = match[3];
          } else {
            updates.adresse_rue = adresseComplete;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          onChange({ ...data, ...updates });
        }
      }
    } catch (error) {
      console.error('Erreur upload:', error);
    } finally {
      setDocumentUploading(false);
    }
  };

  const validateMatricule = (matricule: string): boolean => {
    if (!matricule) return false;
    if (!/^\d{13}$/.test(matricule)) return false;
    
    // Validation de la clé de contrôle luxembourgeoise
    const digits = matricule.split('').map(Number);
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let product = digits[i] * weights[i];
      if (product > 9) {
        product = Math.floor(product / 10) + (product % 10);
      }
      sum += product;
    }
    
    const checksum = (10 - (sum % 10)) % 10;
    return checksum === digits[12];
  };

  const getMatriculeValidationMessage = () => {
    if (!data.matricule) return null;
    
    if (!/^\d{13}$/.test(data.matricule)) {
      return {
        type: 'error',
        message: 'Le matricule doit contenir exactement 13 chiffres'
      };
    }
    
    if (!validateMatricule(data.matricule)) {
      return {
        type: 'error',
        message: 'Le matricule luxembourgeois n\'est pas valide (erreur de clé de contrôle)'
      };
    }
    
    return {
      type: 'success',
      message: 'Matricule luxembourgeois valide ✓'
    };
  };

  const nationalites = [
    'Luxembourgeoise',
    'Française',
    'Allemande',
    'Belge',
    'Portugaise',
    'Italienne',
    'Espagnole',
    'Néerlandaise',
    'Britannique',
    'Américaine',
    'Autre'
  ];

  const civilites = [
    'Monsieur',
    'Madame',
    'Mademoiselle'
  ];

  const matriculeValidation = getMatriculeValidationMessage();

  return (
    <Box>
      {/* Scanner IA pour pièce d'identité */}
      {session?.consentements?.ia_externe && (
        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <SmartToy color="primary" />
              <Box flexGrow={1}>
                <Typography variant="h6">
                  Scanner intelligent de pièce d'identité
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Téléchargez votre carte d'identité ou passeport pour un remplissage automatique
                </Typography>
              </Box>
            </Box>
            
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileUpload(e, 'piece_identite')}
              style={{ display: 'none' }}
              id="piece-identite-upload"
              disabled={documentUploading || aiProcessing}
            />
            
            <Box display="flex" gap={2} alignItems="center">
              <label htmlFor="piece-identite-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<Upload />}
                  disabled={documentUploading || aiProcessing}
                  color="primary"
                >
                  {documentUploading ? 'Traitement...' : 'Scanner ma pièce d\'identité'}
                </Button>
              </label>
              
              {(documentUploading || aiProcessing) && (
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary">
                    IA en cours de traitement...
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Résultats du scan */}
            {uploadResults.filter(r => r.documentType === 'piece_identite').map((result, index) => (
              <Alert 
                key={index}
                severity={result.result.success ? 'success' : 'error'}
                sx={{ mt: 2 }}
                icon={result.result.success ? <CheckCircle /> : <Error />}
              >
                <Typography variant="subtitle2">
                  {result.fileName} - {result.result.success ? 'Scanné avec succès' : 'Erreur de scan'}
                </Typography>
                {result.result.success && (
                  <Typography variant="body2">
                    Confiance: {(result.result.confidence * 100).toFixed(1)}% | 
                    Champs détectés: {Object.keys(result.result.extractedData || {}).length}
                  </Typography>
                )}
                {result.result.suggestions && result.result.suggestions.length > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Suggestions: {result.result.suggestions.join(', ')}
                  </Typography>
                )}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Formulaire principal */}
      <Grid container spacing={3}>
        {/* Civilité et identité */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.civilite}>
            <InputLabel>Civilité</InputLabel>
            <Select
              value={data.civilite || ''}
              onChange={(e) => handleInputChange('civilite', e.target.value)}
              label="Civilité"
            >
              {civilites.map((civilite) => (
                <MenuItem key={civilite} value={civilite}>
                  {civilite}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.nationalite}>
            <InputLabel>Nationalité</InputLabel>
            <Select
              value={data.nationalite || ''}
              onChange={(e) => handleInputChange('nationalite', e.target.value)}
              label="Nationalité"
            >
              {nationalites.map((nationalite) => (
                <MenuItem key={nationalite} value={nationalite}>
                  {nationalite}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Nom et prénom */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nom de famille"
            value={data.nom || ''}
            onChange={(e) => handleInputChange('nom', e.target.value)}
            error={!!errors.nom}
            helperText={errors.nom}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Prénom"
            value={data.prenom || ''}
            onChange={(e) => handleInputChange('prenom', e.target.value)}
            error={!!errors.prenom}
            helperText={errors.prenom}
            required
          />
        </Grid>

        {/* Date de naissance */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Date de naissance"
            type="date"
            value={data.date_naissance || ''}
            onChange={(e) => handleInputChange('date_naissance', e.target.value)}
            error={!!errors.date_naissance}
            helperText={errors.date_naissance}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>

        {/* Matricule luxembourgeois */}
        <Grid item xs={12} md={6}>
          <Box>
            <TextField
              fullWidth
              label="Numéro de matricule luxembourgeois"
              value={data.matricule || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                handleInputChange('matricule', value);
              }}
              error={!!errors.matricule || (matriculeValidation?.type === 'error')}
              helperText={errors.matricule || matriculeValidation?.message}
              required
              InputProps={{
                endAdornment: (
                  <Tooltip title="Le matricule luxembourgeois est un numéro unique de 13 chiffres attribué à chaque résident. Il figure sur votre carte d'identité.">
                    <IconButton size="small">
                      <Help fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
            {matriculeValidation?.type === 'success' && (
              <Chip
                icon={<CheckCircle />}
                label="Matricule valide"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Grid>

        {/* Adresse */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom color="primary">
            Adresse de résidence
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Rue et numéro"
            value={data.adresse_rue || ''}
            onChange={(e) => handleInputChange('adresse_rue', e.target.value)}
            error={!!errors.adresse_rue}
            helperText={errors.adresse_rue}
            required
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Code postal"
            value={data.adresse_code_postal || ''}
            onChange={(e) => {
              let value = e.target.value.toUpperCase();
              if (!value.startsWith('L-') && value.length > 0) {
                value = 'L-' + value.replace(/[^0-9]/g, '').slice(0, 4);
              }
              handleInputChange('adresse_code_postal', value);
            }}
            error={!!errors.adresse_code_postal}
            helperText={errors.adresse_code_postal || 'Format: L-1234'}
            required
            placeholder="L-1234"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Commune"
            value={data.adresse_commune || ''}
            onChange={(e) => handleInputChange('adresse_commune', e.target.value)}
            error={!!errors.adresse_commune}
            helperText={errors.adresse_commune}
            required
          />
        </Grid>

        {/* Contact */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom color="primary">
            Informations de contact (optionnel)
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Numéro de téléphone"
            value={data.telephone || ''}
            onChange={(e) => handleInputChange('telephone', e.target.value)}
            error={!!errors.telephone}
            helperText={errors.telephone || 'Format: +352 12 34 56 78'}
            placeholder="+352 12 34 56 78"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Adresse e-mail"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>
      </Grid>

      {/* Aide contextuelle */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          💡 <strong>Conseil :</strong> {session?.consentements?.ia_externe 
            ? 'Utilisez le scanner IA pour remplir automatiquement les champs à partir de votre pièce d\'identité.'
            : 'Vérifiez que toutes les informations correspondent exactement à celles de votre pièce d\'identité officielle.'
          }
        </Typography>
      </Alert>
    </Box>
  );
};

export default DemandeurPrincipalStep; 