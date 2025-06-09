import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Alert,
  Chip,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Home,
  LocationOn,
  Euro,
  Info,
  Calculate
} from '@mui/icons-material';

interface LogementData {
  statut_logement: 'proprietaire' | 'locataire' | 'heberge' | '';
  type_logement: 'appartement' | 'maison' | 'studio' | 'autre' | '';
  superficie_logement?: number;
  nombre_pieces?: number;
  loyer_mensuel?: number;
  charges_mensuelles?: number;
  total_logement_mensuel: number;
  adresse_complete?: string;
  code_postal_logement?: string;
  commune_logement?: string;
  date_entree_logement?: string;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
}

interface LogementStepProps {
  data: LogementData;
  onChange: (data: LogementData) => void;
  errors: Record<string, string>;
}

const LogementStep: React.FC<LogementStepProps> = ({
  data,
  onChange,
  errors
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<LogementData>({
    statut_logement: data?.statut_logement || '',
    type_logement: data?.type_logement || '',
    superficie_logement: data?.superficie_logement || undefined,
    nombre_pieces: data?.nombre_pieces || undefined,
    loyer_mensuel: data?.loyer_mensuel || undefined,
    charges_mensuelles: data?.charges_mensuelles || undefined,
    total_logement_mensuel: data?.total_logement_mensuel || 0,
    adresse_complete: data?.adresse_complete || '',
    code_postal_logement: data?.code_postal_logement || '',
    commune_logement: data?.commune_logement || '',
    date_entree_logement: data?.date_entree_logement || '',
    proprietaire_nom: data?.proprietaire_nom || '',
    proprietaire_telephone: data?.proprietaire_telephone || ''
  });

  // Calcul automatique du total logement
  useEffect(() => {
    const loyer = formData.loyer_mensuel || 0;
    const charges = formData.charges_mensuelles || 0;
    const total = loyer + charges;
    
    const newData = { ...formData, total_logement_mensuel: total };
    setFormData(newData);
    onChange(newData);
  }, [formData.loyer_mensuel, formData.charges_mensuelles]);

  const handleChange = (field: keyof LogementData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const statutOptions = [
    { value: 'proprietaire', label: 'Propriétaire', icon: '🏠', description: 'Vous êtes propriétaire du logement' },
    { value: 'locataire', label: 'Locataire', icon: '🔑', description: 'Vous payez un loyer mensuel' },
    { value: 'heberge', label: 'Hébergé(e)', icon: '🏡', description: 'Logé gratuitement chez un tiers' }
  ];

  const typeOptions = [
    { value: 'appartement', label: 'Appartement', icon: '🏢' },
    { value: 'maison', label: 'Maison', icon: '🏠' },
    { value: 'studio', label: 'Studio', icon: '🏠' },
    { value: 'autre', label: 'Autre', icon: '🏘️' }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Home />
        Informations sur votre logement
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Ces informations permettent d'évaluer vos charges de logement dans le calcul de l'allocation.
      </Typography>

      {/* Statut du logement */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl component="fieldset" fullWidth error={!!errors.statut_logement}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Statut de votre logement *
            </FormLabel>
            
            <RadioGroup
              value={formData.statut_logement}
              onChange={(e) => handleChange('statut_logement', e.target.value)}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                {statutOptions.map((option) => (
                  <Card 
                    key={option.value}
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      border: formData.statut_logement === option.value ? 2 : 1,
                      borderColor: formData.statut_logement === option.value ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleChange('statut_logement', option.value)}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h4">{option.icon}</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <FormControlLabel
                          value={option.value}
                          control={<Radio />}
                          label={option.label}
                          sx={{ m: 0 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </RadioGroup>
            
            {errors.statut_logement && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.statut_logement}
              </Typography>
            )}
          </FormControl>
        </CardContent>
      </Card>

      {/* Type de logement */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
              Type de logement
            </FormLabel>
            
            <RadioGroup
              row
              value={formData.type_logement}
              onChange={(e) => handleChange('type_logement', e.target.value)}
            >
              {typeOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">{option.icon}</Typography>
                      <Typography variant="body2">{option.label}</Typography>
                    </Box>
                  }
                  sx={{ mr: 3 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Caractéristiques du logement */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📐 Caractéristiques du logement
          </Typography>
          
          <Box display="flex" gap={3}>
            <TextField
              label="Superficie (m²)"
              type="number"
              value={formData.superficie_logement || ''}
              onChange={(e) => handleChange('superficie_logement', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 10, max: 1000 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">m²</InputAdornment>
              }}
              helperText="Surface habitable approximative"
              sx={{ flexGrow: 1 }}
            />
            
            <TextField
              label="Nombre de pièces"
              type="number"
              value={formData.nombre_pieces || ''}
              onChange={(e) => handleChange('nombre_pieces', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 1, max: 20 }}
              helperText="Chambres + salon + cuisine"
              sx={{ flexGrow: 1 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Coûts du logement */}
      {formData.statut_logement === 'locataire' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <Euro sx={{ mr: 1 }} />
              Coûts du logement
            </Typography>
            
            <Box display="flex" gap={3} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Loyer mensuel"
                type="number"
                value={formData.loyer_mensuel || ''}
                onChange={(e) => handleChange('loyer_mensuel', parseFloat(e.target.value) || undefined)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                helperText="Loyer hors charges"
                error={!!errors.loyer_mensuel}
              />
              
              <TextField
                fullWidth
                label="Charges mensuelles"
                type="number"
                value={formData.charges_mensuelles || ''}
                onChange={(e) => handleChange('charges_mensuelles', parseFloat(e.target.value) || undefined)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                helperText="Eau, électricité, chauffage..."
              />
            </Box>

            {/* Total automatique */}
            <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Total logement mensuel : {formData.total_logement_mensuel.toFixed(2)} €
                </Typography>
                <Typography variant="body2">
                  Ce montant sera pris en compte dans le calcul de votre allocation
                </Typography>
              </Box>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Informations propriétaire (si locataire) */}
      {formData.statut_logement === 'locataire' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              👤 Informations du propriétaire
            </Typography>
            
            <Box display="flex" gap={3}>
              <TextField
                fullWidth
                label="Nom du propriétaire"
                value={formData.proprietaire_nom || ''}
                onChange={(e) => handleChange('proprietaire_nom', e.target.value)}
                helperText="Nom ou société de gestion"
              />
              
              <TextField
                fullWidth
                label="Téléphone du propriétaire"
                value={formData.proprietaire_telephone || ''}
                onChange={(e) => handleChange('proprietaire_telephone', e.target.value)}
                helperText="Pour contact si nécessaire"
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Adresse du logement */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📍 Adresse du logement
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              fullWidth
              label="Adresse complète"
              value={formData.adresse_complete || ''}
              onChange={(e) => handleChange('adresse_complete', e.target.value)}
              placeholder="Numéro, rue, résidence..."
              multiline
              rows={2}
            />
            
            <Box display="flex" gap={3}>
              <TextField
                label="Code postal"
                value={formData.code_postal_logement || ''}
                onChange={(e) => handleChange('code_postal_logement', e.target.value)}
                placeholder="L-1234"
                sx={{ width: 150 }}
              />
              
              <TextField
                fullWidth
                label="Commune"
                value={formData.commune_logement || ''}
                onChange={(e) => handleChange('commune_logement', e.target.value)}
                placeholder="Luxembourg, Esch-sur-Alzette..."
              />
            </Box>
            
            <TextField
              label="Date d'entrée dans le logement"
              type="date"
              value={formData.date_entree_logement || ''}
              onChange={(e) => handleChange('date_entree_logement', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Date à laquelle vous avez emménagé"
              sx={{ width: 250 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Récapitulatif */}
      <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Récapitulatif logement
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            {formData.statut_logement && (
              <Chip 
                label={`${statutOptions.find(s => s.value === formData.statut_logement)?.icon} ${statutOptions.find(s => s.value === formData.statut_logement)?.label}`}
                color="primary" 
                variant="filled"
              />
            )}
            
            {formData.type_logement && (
              <Chip 
                label={`${typeOptions.find(t => t.value === formData.type_logement)?.icon} ${typeOptions.find(t => t.value === formData.type_logement)?.label}`}
                color="primary" 
                variant="filled"
              />
            )}
            
            {formData.superficie_logement && (
              <Chip 
                label={`📐 ${formData.superficie_logement} m²`}
                color="primary" 
                variant="filled"
              />
            )}
            
            {formData.nombre_pieces && (
              <Chip 
                label={`🏠 ${formData.nombre_pieces} pièces`}
                color="primary" 
                variant="filled"
              />
            )}
          </Box>
          
          {formData.statut_logement === 'locataire' && formData.total_logement_mensuel > 0 && (
            <>
              <Divider sx={{ my: 2, bgcolor: 'primary.contrastText', opacity: 0.3 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                💰 Coût total : {formData.total_logement_mensuel.toFixed(2)} €/mois
              </Typography>
            </>
          )}
          
          <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="body2">
              💡 Ces informations permettent d'évaluer vos charges de logement dans le calcul de l'allocation de vie chère.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LogementStep; 