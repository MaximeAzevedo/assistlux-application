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
  Divider,
  InputAdornment
} from '@mui/material';
import {
  People,
  Person,
  ChildCare,
  Groups,
  Info
} from '@mui/icons-material';

interface CompositionMenageData {
  situation_familiale: 'celibataire' | 'marie' | 'divorce' | 'veuf' | 'union_libre' | '';
  conjoint_present: boolean;
  conjoint_nom?: string;
  conjoint_prenom?: string;
  conjoint_date_naissance?: string;
  nombre_enfants_0_17: number;
  nombre_enfants_18_24: number;
  autres_personnes: number;
  total_personnes_menage: number;
  revenus_conjoint: boolean;
}

interface CompositionMenageStepProps {
  data: CompositionMenageData;
  onChange: (data: CompositionMenageData) => void;
  errors: Record<string, string>;
}

const CompositionMenageStep: React.FC<CompositionMenageStepProps> = ({
  data,
  onChange,
  errors
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<CompositionMenageData>({
    situation_familiale: data?.situation_familiale || '',
    conjoint_present: data?.conjoint_present || false,
    conjoint_nom: data?.conjoint_nom || '',
    conjoint_prenom: data?.conjoint_prenom || '',
    conjoint_date_naissance: data?.conjoint_date_naissance || '',
    nombre_enfants_0_17: data?.nombre_enfants_0_17 || 0,
    nombre_enfants_18_24: data?.nombre_enfants_18_24 || 0,
    autres_personnes: data?.autres_personnes || 0,
    total_personnes_menage: data?.total_personnes_menage || 1,
    revenus_conjoint: data?.revenus_conjoint || false
  });

  // Calcul automatique du total des personnes
  useEffect(() => {
    const total = 1 + // Demandeur
                 (formData.conjoint_present ? 1 : 0) + // Conjoint
                 formData.nombre_enfants_0_17 +
                 formData.nombre_enfants_18_24 +
                 formData.autres_personnes;
    
    const newData = { ...formData, total_personnes_menage: total };
    setFormData(newData);
    onChange(newData);
  }, [
    formData.conjoint_present,
    formData.nombre_enfants_0_17,
    formData.nombre_enfants_18_24,
    formData.autres_personnes
  ]);

  const handleChange = (field: keyof CompositionMenageData, value: any) => {
    const newData = { ...formData, [field]: value };
    
    // Logique métier
    if (field === 'situation_familiale') {
      newData.conjoint_present = ['marie', 'union_libre'].includes(value);
      if (!newData.conjoint_present) {
        newData.conjoint_nom = '';
        newData.conjoint_prenom = '';
        newData.conjoint_date_naissance = '';
        newData.revenus_conjoint = false;
      }
    }
    
    setFormData(newData);
    onChange(newData);
  };

  const situationOptions = [
    { value: 'celibataire', label: 'Célibataire', icon: '👤' },
    { value: 'marie', label: 'Marié(e)', icon: '💑' },
    { value: 'union_libre', label: 'Union libre / Partenariat', icon: '👫' },
    { value: 'divorce', label: 'Divorcé(e)', icon: '💔' },
    { value: 'veuf', label: 'Veuf/Veuve', icon: '🖤' }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Groups />
        Composition de votre ménage
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Ces informations permettent de calculer les seuils d'éligibilité selon la taille de votre ménage.
      </Typography>

      {/* Situation familiale */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl component="fieldset" fullWidth error={!!errors.situation_familiale}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Situation familiale *
            </FormLabel>
            
            <RadioGroup
              value={formData.situation_familiale}
              onChange={(e) => handleChange('situation_familiale', e.target.value)}
            >
              <Grid container spacing={2}>
                {situationOptions.map((option) => (
                  <Grid item xs={12} sm={6} md={4} key={option.value}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        border: formData.situation_familiale === option.value ? 2 : 1,
                        borderColor: formData.situation_familiale === option.value ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => handleChange('situation_familiale', option.value)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>{option.icon}</Typography>
                        <FormControlLabel
                          value={option.value}
                          control={<Radio />}
                          label={option.label}
                          sx={{ m: 0 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
            
            {errors.situation_familiale && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.situation_familiale}
              </Typography>
            )}
          </FormControl>
        </CardContent>
      </Card>

      {/* Informations conjoint */}
      {formData.conjoint_present && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              👫 Informations du conjoint/partenaire
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom du conjoint"
                  value={formData.conjoint_nom || ''}
                  onChange={(e) => handleChange('conjoint_nom', e.target.value)}
                  error={!!errors.conjoint_nom}
                  helperText={errors.conjoint_nom}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom du conjoint"
                  value={formData.conjoint_prenom || ''}
                  onChange={(e) => handleChange('conjoint_prenom', e.target.value)}
                  error={!!errors.conjoint_prenom}
                  helperText={errors.conjoint_prenom}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date de naissance"
                  type="date"
                  value={formData.conjoint_date_naissance || ''}
                  onChange={(e) => handleChange('conjoint_date_naissance', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Le conjoint a-t-il des revenus ?</FormLabel>
                  <RadioGroup
                    row
                    value={formData.revenus_conjoint}
                    onChange={(e) => handleChange('revenus_conjoint', e.target.value === 'true')}
                  >
                    <FormControlLabel value={true} control={<Radio />} label="Oui" />
                    <FormControlLabel value={false} control={<Radio />} label="Non" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Enfants et autres personnes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            <ChildCare sx={{ mr: 1 }} />
            Enfants et autres personnes à charge
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enfants de 0 à 17 ans"
                type="number"
                value={formData.nombre_enfants_0_17}
                onChange={(e) => handleChange('nombre_enfants_0_17', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 10 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">👶</InputAdornment>
                }}
                helperText="Enfants mineurs vivant dans le ménage"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enfants de 18 à 24 ans"
                type="number"
                value={formData.nombre_enfants_18_24}
                onChange={(e) => handleChange('nombre_enfants_18_24', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 10 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">🧑</InputAdornment>
                }}
                helperText="Enfants majeurs étudiants ou sans revenus"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Autres personnes à charge"
                type="number"
                value={formData.autres_personnes}
                onChange={(e) => handleChange('autres_personnes', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">👥</InputAdornment>
                }}
                helperText="Parents âgés, personnes handicapées, etc."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Récapitulatif */}
      <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <People sx={{ mr: 1 }} />
            Récapitulatif de votre ménage
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
            <Chip 
              label={`👤 Vous (demandeur)`} 
              color="primary" 
              variant="filled"
            />
            
            {formData.conjoint_present && (
              <Chip 
                label={`👫 Conjoint/Partenaire`} 
                color="primary" 
                variant="filled"
              />
            )}
            
            {formData.nombre_enfants_0_17 > 0 && (
              <Chip 
                label={`👶 ${formData.nombre_enfants_0_17} enfant(s) 0-17 ans`} 
                color="primary" 
                variant="filled"
              />
            )}
            
            {formData.nombre_enfants_18_24 > 0 && (
              <Chip 
                label={`🧑 ${formData.nombre_enfants_18_24} enfant(s) 18-24 ans`} 
                color="primary" 
                variant="filled"
              />
            )}
            
            {formData.autres_personnes > 0 && (
              <Chip 
                label={`👥 ${formData.autres_personnes} autre(s) personne(s)`} 
                color="primary" 
                variant="filled"
              />
            )}
          </Box>
          
          <Divider sx={{ my: 2, bgcolor: 'primary.contrastText', opacity: 0.3 }} />
          
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Total : {formData.total_personnes_menage} personne(s) dans le ménage
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="body2">
              💡 Ce nombre détermine les seuils d'éligibilité pour l'allocation de vie chère.
              Plus le ménage est important, plus les seuils de revenus sont élevés.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompositionMenageStep; 