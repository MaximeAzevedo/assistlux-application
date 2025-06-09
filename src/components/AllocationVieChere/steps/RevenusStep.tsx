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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Euro,
  Work,
  AccountBalance,
  ExpandMore,
  Calculate,
  TrendingUp,
  Info
} from '@mui/icons-material';

interface RevenusData {
  // Demandeur
  revenus_salaire_demandeur: number;
  revenus_pension_demandeur: number;
  revenus_chomage_demandeur: number;
  revenus_invalidite_demandeur: number;
  revenus_autres_demandeur: number;
  total_revenus_demandeur: number;
  
  // Conjoint
  conjoint_revenus: boolean;
  revenus_salaire_conjoint: number;
  revenus_pension_conjoint: number;
  revenus_chomage_conjoint: number;
  revenus_invalidite_conjoint: number;
  revenus_autres_conjoint: number;
  total_revenus_conjoint: number;
  
  // Ménage
  allocations_familiales: number;
  autres_revenus_menage: number;
  total_revenus_menage: number;
  
  // Informations complémentaires
  employeur_demandeur?: string;
  employeur_conjoint?: string;
  situation_professionnelle_demandeur: 'salarie' | 'independant' | 'retraite' | 'chomage' | 'invalide' | 'autre' | '';
  situation_professionnelle_conjoint: 'salarie' | 'independant' | 'retraite' | 'chomage' | 'invalide' | 'autre' | '';
}

interface RevenusStepProps {
  data: RevenusData;
  onChange: (data: RevenusData) => void;
  errors: Record<string, string>;
}

const RevenusStep: React.FC<RevenusStepProps> = ({
  data,
  onChange,
  errors
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<RevenusData>({
    revenus_salaire_demandeur: data?.revenus_salaire_demandeur || 0,
    revenus_pension_demandeur: data?.revenus_pension_demandeur || 0,
    revenus_chomage_demandeur: data?.revenus_chomage_demandeur || 0,
    revenus_invalidite_demandeur: data?.revenus_invalidite_demandeur || 0,
    revenus_autres_demandeur: data?.revenus_autres_demandeur || 0,
    total_revenus_demandeur: data?.total_revenus_demandeur || 0,
    
    conjoint_revenus: data?.conjoint_revenus || false,
    revenus_salaire_conjoint: data?.revenus_salaire_conjoint || 0,
    revenus_pension_conjoint: data?.revenus_pension_conjoint || 0,
    revenus_chomage_conjoint: data?.revenus_chomage_conjoint || 0,
    revenus_invalidite_conjoint: data?.revenus_invalidite_conjoint || 0,
    revenus_autres_conjoint: data?.revenus_autres_conjoint || 0,
    total_revenus_conjoint: data?.total_revenus_conjoint || 0,
    
    allocations_familiales: data?.allocations_familiales || 0,
    autres_revenus_menage: data?.autres_revenus_menage || 0,
    total_revenus_menage: data?.total_revenus_menage || 0,
    
    employeur_demandeur: data?.employeur_demandeur || '',
    employeur_conjoint: data?.employeur_conjoint || '',
    situation_professionnelle_demandeur: data?.situation_professionnelle_demandeur || '',
    situation_professionnelle_conjoint: data?.situation_professionnelle_conjoint || ''
  });

  // Calculs automatiques
  useEffect(() => {
    // Total demandeur
    const totalDemandeur = 
      formData.revenus_salaire_demandeur +
      formData.revenus_pension_demandeur +
      formData.revenus_chomage_demandeur +
      formData.revenus_invalidite_demandeur +
      formData.revenus_autres_demandeur;
    
    // Total conjoint
    const totalConjoint = formData.conjoint_revenus ? (
      formData.revenus_salaire_conjoint +
      formData.revenus_pension_conjoint +
      formData.revenus_chomage_conjoint +
      formData.revenus_invalidite_conjoint +
      formData.revenus_autres_conjoint
    ) : 0;
    
    // Total ménage
    const totalMenage = 
      totalDemandeur +
      totalConjoint +
      formData.allocations_familiales +
      formData.autres_revenus_menage;
    
    const newData = {
      ...formData,
      total_revenus_demandeur: totalDemandeur,
      total_revenus_conjoint: totalConjoint,
      total_revenus_menage: totalMenage
    };
    
    setFormData(newData);
    onChange(newData);
  }, [
    formData.revenus_salaire_demandeur,
    formData.revenus_pension_demandeur,
    formData.revenus_chomage_demandeur,
    formData.revenus_invalidite_demandeur,
    formData.revenus_autres_demandeur,
    formData.conjoint_revenus,
    formData.revenus_salaire_conjoint,
    formData.revenus_pension_conjoint,
    formData.revenus_chomage_conjoint,
    formData.revenus_invalidite_conjoint,
    formData.revenus_autres_conjoint,
    formData.allocations_familiales,
    formData.autres_revenus_menage
  ]);

  const handleChange = (field: keyof RevenusData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const situationOptions = [
    { value: 'salarie', label: 'Salarié(e)', icon: '💼' },
    { value: 'independant', label: 'Indépendant(e)', icon: '🏢' },
    { value: 'retraite', label: 'Retraité(e)', icon: '👴' },
    { value: 'chomage', label: 'Demandeur d\'emploi', icon: '🔍' },
    { value: 'invalide', label: 'Invalide/Incapacité', icon: '♿' },
    { value: 'autre', label: 'Autre situation', icon: '❓' }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Euro />
        Revenus et ressources du ménage
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Indiquez tous les revenus nets mensuels de votre ménage. Ces informations déterminent votre éligibilité.
      </Typography>

      {/* Revenus du demandeur */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" color="primary">
            👤 Vos revenus (demandeur principal)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <FormLabel component="legend">Situation professionnelle</FormLabel>
              <RadioGroup
                row
                value={formData.situation_professionnelle_demandeur}
                onChange={(e) => handleChange('situation_professionnelle_demandeur', e.target.value)}
              >
                {situationOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1">{option.icon}</Typography>
                        <Typography variant="caption">{option.label}</Typography>
                      </Box>
                    }
                    sx={{ mr: 2 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salaire net mensuel"
                  type="number"
                  value={formData.revenus_salaire_demandeur || ''}
                  onChange={(e) => handleChange('revenus_salaire_demandeur', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  helperText="Salaire après déductions sociales"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pension/Retraite"
                  type="number"
                  value={formData.revenus_pension_demandeur || ''}
                  onChange={(e) => handleChange('revenus_pension_demandeur', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  helperText="Pension de retraite ou invalidité"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Allocation chômage"
                  type="number"
                  value={formData.revenus_chomage_demandeur || ''}
                  onChange={(e) => handleChange('revenus_chomage_demandeur', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  helperText="Indemnités ADEM"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Autres revenus"
                  type="number"
                  value={formData.revenus_autres_demandeur || ''}
                  onChange={(e) => handleChange('revenus_autres_demandeur', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  helperText="Revenus locatifs, dividendes..."
                />
              </Grid>
              
              {formData.situation_professionnelle_demandeur === 'salarie' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom de l'employeur"
                    value={formData.employeur_demandeur || ''}
                    onChange={(e) => handleChange('employeur_demandeur', e.target.value)}
                    helperText="Nom de votre entreprise ou employeur"
                  />
                </Grid>
              )}
            </Grid>
            
            <Alert severity="info" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Total vos revenus : {formData.total_revenus_demandeur.toFixed(2)} €/mois
              </Typography>
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Revenus du conjoint */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" color="primary">
            👫 Revenus du conjoint/partenaire
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Votre conjoint/partenaire a-t-il des revenus ?</FormLabel>
            <RadioGroup
              row
              value={formData.conjoint_revenus}
              onChange={(e) => handleChange('conjoint_revenus', e.target.value === 'true')}
            >
              <FormControlLabel value={true} control={<Radio />} label="Oui" />
              <FormControlLabel value={false} control={<Radio />} label="Non" />
            </RadioGroup>
          </FormControl>

          {formData.conjoint_revenus && (
            <Box>
              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend">Situation professionnelle du conjoint</FormLabel>
                <RadioGroup
                  row
                  value={formData.situation_professionnelle_conjoint}
                  onChange={(e) => handleChange('situation_professionnelle_conjoint', e.target.value)}
                >
                  {situationOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body1">{option.icon}</Typography>
                          <Typography variant="caption">{option.label}</Typography>
                        </Box>
                      }
                      sx={{ mr: 2 }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Salaire net mensuel"
                    type="number"
                    value={formData.revenus_salaire_conjoint || ''}
                    onChange={(e) => handleChange('revenus_salaire_conjoint', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pension/Retraite"
                    type="number"
                    value={formData.revenus_pension_conjoint || ''}
                    onChange={(e) => handleChange('revenus_pension_conjoint', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Allocation chômage"
                    type="number"
                    value={formData.revenus_chomage_conjoint || ''}
                    onChange={(e) => handleChange('revenus_chomage_conjoint', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Autres revenus"
                    type="number"
                    value={formData.revenus_autres_conjoint || ''}
                    onChange={(e) => handleChange('revenus_autres_conjoint', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                  />
                </Grid>
                
                {formData.situation_professionnelle_conjoint === 'salarie' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nom de l'employeur du conjoint"
                      value={formData.employeur_conjoint || ''}
                      onChange={(e) => handleChange('employeur_conjoint', e.target.value)}
                    />
                  </Grid>
                )}
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculate />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Total revenus conjoint : {formData.total_revenus_conjoint.toFixed(2)} €/mois
                </Typography>
              </Alert>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Autres revenus du ménage */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            <AccountBalance sx={{ mr: 1 }} />
            Autres revenus du ménage
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Allocations familiales"
                type="number"
                value={formData.allocations_familiales || ''}
                onChange={(e) => handleChange('allocations_familiales', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                helperText="Allocations pour enfants"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Autres revenus du ménage"
                type="number"
                value={formData.autres_revenus_menage || ''}
                onChange={(e) => handleChange('autres_revenus_menage', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                helperText="Aides diverses, revenus exceptionnels..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Récapitulatif total */}
      <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TrendingUp sx={{ mr: 1 }} />
            Récapitulatif des revenus
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">👤 Vos revenus :</Typography>
              <Chip 
                label={`${formData.total_revenus_demandeur.toFixed(2)} €`}
                color="primary" 
                variant="filled"
              />
            </Box>
            
            {formData.conjoint_revenus && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">👫 Revenus conjoint :</Typography>
                <Chip 
                  label={`${formData.total_revenus_conjoint.toFixed(2)} €`}
                  color="primary" 
                  variant="filled"
                />
              </Box>
            )}
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">👶 Allocations familiales :</Typography>
              <Chip 
                label={`${formData.allocations_familiales.toFixed(2)} €`}
                color="primary" 
                variant="filled"
              />
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">💰 Autres revenus :</Typography>
              <Chip 
                label={`${formData.autres_revenus_menage.toFixed(2)} €`}
                color="primary" 
                variant="filled"
              />
            </Box>
            
            <Divider sx={{ my: 1, bgcolor: 'primary.contrastText', opacity: 0.3 }} />
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                💰 TOTAL MÉNAGE :
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formData.total_revenus_menage.toFixed(2)} €/mois
              </Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="body2">
              💡 Ce montant total détermine votre éligibilité à l'allocation de vie chère selon les seuils en vigueur.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RevenusStep; 