import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Security,
  SmartToy,
  DataUsage,
  Shield,
  CheckCircle
} from '@mui/icons-material';

interface ConsentementRGPDProps {
  open: boolean;
  onAccept: (niveau: 'MINIMAL' | 'STANDARD' | 'COMPLET') => void;
  supabaseReady: boolean;
}

const ConsentementRGPD: React.FC<ConsentementRGPDProps> = ({
  open,
  onAccept,
  supabaseReady
}) => {
  const niveauxConsentement = [
    {
      id: 'MINIMAL' as const,
      titre: '🔒 Niveau Minimal',
      description: 'Fonctionnalités essentielles uniquement',
      couleur: 'warning' as const,
      features: [
        'Formulaire de base',
        'Validation locale',
        'Aucun stockage externe',
        'Session temporaire'
      ]
    },
    {
      id: 'STANDARD' as const,
      titre: '⚖️ Niveau Standard',
      description: 'Équilibre fonctionnalité/confidentialité',
      couleur: 'info' as const,
      features: [
        'Sauvegarde sécurisée',
        'Calculs d\'éligibilité',
        'Session persistante',
        'Audit de sécurité'
      ]
    },
    {
      id: 'COMPLET' as const,
      titre: '🚀 Niveau Complet',
      description: 'Toutes les fonctionnalités avancées',
      couleur: 'success' as const,
      features: [
        'Assistant IA intégré',
        'Scan automatique documents',
        'Pré-remplissage intelligent',
        'Optimisation complète'
      ]
    }
  ];

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Shield color="primary" />
          <Typography variant="h5">
            🇱🇺 Consentement RGPD - AssistLux
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            📋 <strong>Conformité Luxembourg :</strong> Choisissez votre niveau de consentement 
            selon vos préférences de confidentialité. Vous pouvez modifier ce choix à tout moment.
          </Typography>
        </Alert>

        {!supabaseReady && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              ⚠️ <strong>Mode dégradé :</strong> Connexion Supabase limitée. 
              Certaines fonctionnalités avancées peuvent être indisponibles.
            </Typography>
          </Alert>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Sélectionnez votre niveau de consentement :
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          {niveauxConsentement.map((niveau) => (
            <Card 
              key={niveau.id}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  bgcolor: 'action.hover',
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s'
                }
              }}
              onClick={() => onAccept(niveau.id)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flexGrow={1}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="h6">
                        {niveau.titre}
                      </Typography>
                      <Chip 
                        label={niveau.id}
                        color={niveau.couleur}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {niveau.description}
                    </Typography>

                    <List dense>
                      {niveau.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle 
                              color={niveau.couleur} 
                              fontSize="small" 
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box textAlign="center" ml={2}>
                    {niveau.id === 'MINIMAL' && <Security color="warning" />}
                    {niveau.id === 'STANDARD' && <DataUsage color="info" />}
                    {niveau.id === 'COMPLET' && <SmartToy color="success" />}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            ✅ <strong>Garanties AssistLux :</strong> Vos données sont chiffrées, 
            auto-supprimées après traitement et jamais partagées avec des tiers.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Typography variant="caption" color="text.secondary" flexGrow={1}>
          🔐 Session sécurisée • Chiffrement AES-256 • Audit complet
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default ConsentementRGPD; 