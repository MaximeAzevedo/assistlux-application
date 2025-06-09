import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  SmartToy,
  Shield,
  Visibility,
  VisibilityOff,
  NavigateNext,
  NavigateBefore,
  Security
} from '@mui/icons-material';

// Hooks centralisés - toute la logique métier !
import useAllocationWizard from '../../hooks/useAllocationWizard';

// Composants des étapes (inchangés)
import DemandeurPrincipalStep from './steps/DemandeurPrincipalStep';
import CompositionMenageStep from './steps/CompositionMenageStep';
import LogementStep from './steps/LogementStep';
import RevenusStep from './steps/RevenusStep';
import DocumentsStep from './steps/DocumentsStep';

// Composants réutilisables
import ConsentementRGPD from './components/ConsentementRGPD';
import ProgressionIndicator from './components/ProgressionIndicator';
import SecurityIndicator from './components/SecurityIndicator';

const AllocationVieCherePageRefactored: React.FC = () => {
  const { t } = useTranslation();
  
  // ═══════════════════════════════════════════════════════════
  // ÉTAT CENTRALISÉ VIA HOOK PRINCIPAL
  // ═══════════════════════════════════════════════════════════
  
  const wizard = useAllocationWizard();
  
  // États locaux d'interface uniquement
  const [consentementDialog, setConsentementDialog] = useState(!wizard.formState.session);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [showEligibilityDetails, setShowEligibilityDetails] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // GESTION DES CONSENTEMENTS RGPD
  // ═══════════════════════════════════════════════════════════
  
  const handleConsentementAccepted = async (niveau: 'MINIMAL' | 'STANDARD' | 'COMPLET') => {
    const session = await wizard.actions.initializeSession(niveau);
    if (session) {
      setConsentementDialog(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDU DES ÉTAPES
  // ═══════════════════════════════════════════════════════════
  
  const renderCurrentStep = () => {
    // Récupérer les données spécifiques à l'étape actuelle
    const currentStepKey = `etape${wizard.formState.currentStep}` as keyof typeof wizard.formState.formData;
    const stepData = wizard.formState.formData[currentStepKey];
    
    // Props communs pour tous les composants d'étapes
    const commonProps = {
      errors: wizard.formState.errors,
      session: wizard.formState.session,
      aiProcessing: wizard.formState.loading,
      readonly: wizard.formState.loading
    };

    switch (wizard.formState.currentStep) {
      case 1:
        return (
          <DemandeurPrincipalStep 
            {...commonProps}
            data={stepData as any}
            onChange={(data: any) => wizard.helpers.updateStepData('etape1', data)}
            onDocumentUpload={(file: File, documentType: string) => 
              wizard.actions.handleDocumentUpload(file, documentType as any)
            }
          />
        );
      case 2:
        return (
          <CompositionMenageStep 
            {...commonProps}
            data={stepData as any}
            onChange={(data: any) => wizard.helpers.updateStepData('etape2', data)}
          />
        );
      case 3:
        return (
          <LogementStep 
            {...commonProps}
            data={stepData as any}
            onChange={(data: any) => wizard.helpers.updateStepData('etape3', data)}
          />
        );
      case 4:
        return (
          <RevenusStep 
            {...commonProps}
            data={stepData as any}
            onChange={(data: any) => wizard.helpers.updateStepData('etape4', data)}
          />
        );
      case 5:
        return (
          <DocumentsStep 
            {...commonProps}
            data={stepData as any}
            onChange={(data: any) => wizard.helpers.updateStepData('etape5', data)}
            onDocumentUpload={(file: File, documentType: string) => 
              wizard.actions.handleDocumentUpload(file, documentType as any)
            }
          />
        );
      default:
        return (
          <DemandeurPrincipalStep 
            {...commonProps}
            data={stepData as any}
            onChange={(data: any) => wizard.helpers.updateStepData('etape1', data)}
            onDocumentUpload={(file: File, documentType: string) => 
              wizard.actions.handleDocumentUpload(file, documentType as any)
            }
          />
        );
    }
  };

  // ═══════════════════════════════════════════════════════════
  // INTERFACE UTILISATEUR SIMPLIFIÉE
  // ═══════════════════════════════════════════════════════════

  // Dialog de consentement RGPD
  if (consentementDialog) {
    return (
      <ConsentementRGPD
        open={consentementDialog}
        onAccept={handleConsentementAccepted}
        supabaseReady={wizard.supabaseState.isReady}
      />
    );
  }

  // Chargement initial
  if (!wizard.isReady) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          🔄 Initialisation sécurisée en cours...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {wizard.supabaseState.loading ? 'Connexion Supabase...' : 'Configuration du système...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* EN-TÊTE AVEC SÉCURITÉ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom>
                {t('allocation.vie.chere.titre', 'Allocation de vie chère')}
              </Typography>
              <Typography variant="subtitle1">
                {t('allocation.vie.chere.description', 'Demande sécurisée avec IA intégrée')}
              </Typography>
            </Box>
            <SecurityIndicator level="high" />
          </Box>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PROGRESSION INTELLIGENTE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      <ProgressionIndicator 
        currentStep={wizard.formState.currentStep - 1} 
        steps={[
          { label: t('allocation.etape1', 'Demandeur'), description: wizard.stepInfo?.description },
          { label: t('allocation.etape2', 'Ménage'), description: 'Composition familiale' },
          { label: t('allocation.etape3', 'Logement'), description: 'Informations logement' },
          { label: t('allocation.etape4', 'Revenus'), description: 'Revenus et ressources' },
          { label: t('allocation.etape5', 'Documents'), description: 'Finalisation' }
        ]}
        progress={wizard.formState.progress}
        onStepClick={(step) => console.log('Navigation vers étape', step)}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* INDICATEURS IA ET ÉLIGIBILITÉ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      {wizard.formState.session?.consentements.ia_externe && (
        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <SmartToy color="primary" />
              <Box flexGrow={1}>
                <Typography variant="h6">
                  🤖 Assistant IA Luxembourg activé
                </Typography>
                <Typography variant="body2">
                  Scan automatique des documents et pré-remplissage intelligent
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowAiDetails(!showAiDetails)}
                startIcon={showAiDetails ? <VisibilityOff /> : <Visibility />}
              >
                Détails
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Résultats d'éligibilité en temps réel */}
      {wizard.calculationState.hasResults && (
        <Card sx={{ 
          mb: 3, 
          bgcolor: wizard.calculationState.isEligible ? 'success.light' : 'warning.light' 
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              {wizard.calculationState.isEligible ? 
                <CheckCircle color="success" /> : 
                <Warning color="warning" />
              }
              <Box flexGrow={1}>
                <Typography variant="h6">
                  {wizard.calculationState.isEligible ? 
                    '✅ Vous êtes éligible !' : 
                    '⚠️ Vérifiez votre éligibilité'
                  }
                </Typography>
                <Typography variant="body2">
                  {wizard.calculationState.results?.montantEstime && 
                    `Montant estimé : ${wizard.calculationState.results.montantEstime}€/mois`
                  }
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowEligibilityDetails(!showEligibilityDetails)}
              >
                Détails
              </Button>
            </Box>
            
            {showEligibilityDetails && (
              <Box mt={2}>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {wizard.calculationState.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ALERTES ET ERREURS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      {wizard.hasErrors && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={wizard.helpers.clearErrors}>
          <Typography variant="h6" gutterBottom>
            Veuillez corriger les erreurs suivantes :
          </Typography>
          <ul>
            {Object.values(wizard.formState.errors).map((error: any, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Erreurs Supabase */}
      {wizard.supabaseState.error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🔄 Mode dégradé : {wizard.supabaseState.error}
          </Typography>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ÉTAPE ACTUELLE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            {wizard.stepInfo?.label}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {wizard.stepInfo?.description}
          </Typography>
          
          {wizard.formState.loading && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" icon={<SmartToy />}>
                Traitement en cours...
              </Alert>
              <LinearProgress sx={{ mt: 1 }} />
            </Box>
          )}
          
          {/* Rendu de l'étape actuelle */}
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NAVIGATION SIMPLIFIÉE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          onClick={wizard.navigationProps.onBack}
          disabled={wizard.navigationProps.isFirstStep || wizard.navigationProps.loading}
          startIcon={<NavigateBefore />}
        >
          {t('common.back', 'Précédent')}
        </Button>
        
        <Box display="flex" gap={2} alignItems="center">
          <Chip
            icon={<Shield />}
            label="Sécurité Maximale"
            color="success"
            size="small"
          />
          
          {wizard.formState.session?.consentements.ia_externe && (
            <Chip
              icon={<SmartToy />}
              label="IA Active"
              color="info"
              size="small"
            />
          )}
          
          <Typography variant="caption" color="text.secondary">
            Session: {wizard.formState.session?.id.split('-')[0]}...
          </Typography>
        </Box>

        {wizard.navigationProps.isLastStep ? (
          <Button
            variant="contained"
            onClick={wizard.navigationProps.onSubmit}
            disabled={wizard.navigationProps.loading}
            color="success"
            size="large"
            sx={{ px: 4 }}
          >
            {wizard.navigationProps.loading ? 
              'Soumission...' : 
              '🚀 Finaliser la demande'
            }
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={wizard.navigationProps.onNext}
            disabled={!wizard.navigationProps.canGoNext || wizard.navigationProps.loading}
            endIcon={<NavigateNext />}
          >
            {t('common.next', 'Suivant')}
          </Button>
        )}
      </Box>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* INFORMATIONS DE DEBUG (DEV SEULEMENT) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      {process.env.NODE_ENV === 'development' && (
        <Card sx={{ mt: 3, bgcolor: 'grey.100' }}>
          <CardContent>
            <Typography variant="caption" display="block">
              🔧 Debug: Étape {wizard.formState.currentStep}/{wizard.navigationProps.totalSteps} | 
              Progression {wizard.formState.progress}% | 
              Supabase {wizard.supabaseState.connected ? '✅' : '❌'}
            </Typography>
            <Typography variant="caption" display="block">
              Éligibilité: {wizard.calculationState.isEligible ? '✅' : '❌'} | 
              Erreurs: {Object.keys(wizard.formState.errors).length}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AllocationVieCherePageRefactored; 