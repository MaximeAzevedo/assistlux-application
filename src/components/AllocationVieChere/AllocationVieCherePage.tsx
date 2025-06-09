import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Alert, 
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { 
  Euro, 
  Security, 
  Speed, 
  CheckCircle, 
  Warning, 
  Info,
  FileUpload,
  Visibility,
  VisibilityOff,
  Shield,
  SmartToy,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import { AllocationVieCherSecureAIService } from '../../services/AllocationVieChere/secureAIService';

// Components des étapes
import DemandeurPrincipalStep from './steps/DemandeurPrincipalStep';
import CompositionMenageStep from './steps/CompositionMenageStep';
import LogementStep from './steps/LogementStep';
import RevenusStep from './steps/RevenusStep';
import DocumentsStep from './steps/DocumentsStep';
import ConsentementRGPD from './components/ConsentementRGPD';
import ProgressionIndicator from './components/ProgressionIndicator';
import SecurityIndicator from './components/SecurityIndicator';
import AllocationVieChereConfirmation from './AllocationVieChereConfirmation';

interface SecureSession {
  id: string;
  token: string;
  expiresAt: Date;
  langue: string;
  consentements: {
    traitement: boolean;
    ia_externe: boolean;
    cookies: boolean;
    analytics: boolean;
  };
}

interface FormData {
  etape1: any;
  etape2: any;
  etape3: any;
  etape4: any;
  etape5: any;
}

const AllocationVieCherePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [aiService] = useState(new AllocationVieCherSecureAIService());
  
  // État du wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    etape1: {},
    etape2: {},
    etape3: {},
    etape4: {},
    etape5: {}
  });
  
  // État de sécurité RGPD
  const [session, setSession] = useState<SecureSession | null>(null);
  const [consentementDialog, setConsentementDialog] = useState(true);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('high');
  
  // État de l'IA
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [showAiDetails, setShowAiDetails] = useState(false);
  
  // État du formulaire
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      label: t('allocation.progres.etape1'),
      component: DemandeurPrincipalStep,
      icon: <Euro />,
      description: t('allocation.progres.etape1.description', 'Informations du demandeur principal')
    },
    {
      label: t('allocation.progres.etape2'),
      component: CompositionMenageStep,
      icon: <Euro />,
      description: t('allocation.progres.etape2.description', 'Composition de votre ménage')
    },
    {
      label: t('allocation.progres.etape3'),
      component: LogementStep,
      icon: <Euro />,
      description: t('allocation.progres.etape3.description', 'Informations sur votre logement')
    },
    {
      label: t('allocation.progres.etape4'),
      component: RevenusStep,
      icon: <Euro />,
      description: t('allocation.progres.etape4.description', 'Vos revenus et ressources')
    },
    {
      label: t('allocation.progres.etape5'),
      component: DocumentsStep,
      icon: <Euro />,
      description: t('allocation.progres.etape5.description', 'Documents et finalisation')
    }
  ];

  // ===============================================
  // GESTION DE LA SESSION SÉCURISÉE
  // ===============================================

  useEffect(() => {
    // Calculer la progression
    const totalSteps = steps.length;
    const completedSteps = Object.keys(formData).filter(key => 
      Object.keys(formData[key as keyof FormData]).length > 0
    ).length;
    setProgress((completedSteps / totalSteps) * 100);
  }, [formData, steps.length]);

  const handleConsentementAccepte = async (consentements: any) => {
    try {
      setLoading(true);
      
      const newSession = await aiService.createSecureSession(
        i18n.language,
        {
          traitement: consentements.traitement,
          ia_externe: consentements.ia,
          cookies: consentements.cookies,
          analytics: consentements.analytics
        }
      );
      
      setSession(newSession);
      setConsentementDialog(false);
      
      // Ajuster le niveau de sécurité selon les consentements
      if (consentements.ia && consentements.traitement) {
        setSecurityLevel('high');
      } else if (consentements.traitement) {
        setSecurityLevel('medium');
      } else {
        setSecurityLevel('low');
      }
      
    } catch (error) {
      console.error('Erreur création session:', error);
      // Fallback : session locale sans IA
      setSession({
        id: 'local_session',
        token: 'local_token',
        expiresAt: new Date(Date.now() + 3600000),
        langue: i18n.language,
        consentements: {
          traitement: consentements.traitement,
          ia_externe: false,
          cookies: false,
          analytics: false
        }
      });
      setSecurityLevel('low');
      setConsentementDialog(false);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // GESTION DU WIZARD
  // ===============================================

  const validateStep = (step: number, data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!data.nom?.trim()) errors.nom = 'Le nom est requis';
        if (!data.prenom?.trim()) errors.prenom = 'Le prénom est requis';
        if (!data.matricule?.trim()) errors.matricule = 'Le matricule national est requis';
        if (!data.date_naissance) errors.date_naissance = 'La date de naissance est requise';
        if (!data.adresse_rue?.trim()) errors.adresse_rue = 'L\'adresse est requise';
        if (!data.adresse_code_postal?.trim()) errors.adresse_code_postal = 'Le code postal est requis';
        if (!data.adresse_commune?.trim()) errors.adresse_commune = 'La commune est requise';
        break;
        
      case 2:
        if (!data.situation_familiale) errors.situation_familiale = 'La situation familiale est requise';
        if (data.conjoint_present && !data.conjoint_nom?.trim()) errors.conjoint_nom = 'Le nom du conjoint est requis';
        if (data.conjoint_present && !data.conjoint_prenom?.trim()) errors.conjoint_prenom = 'Le prénom du conjoint est requis';
        break;
        
      case 3:
        if (!data.statut_logement) errors.statut_logement = 'Le statut du logement est requis';
        if (data.statut_logement === 'locataire' && (!data.loyer_mensuel || data.loyer_mensuel <= 0)) {
          errors.loyer_mensuel = 'Le loyer mensuel est requis pour les locataires';
        }
        break;
        
      case 4:
        // Validation des revenus - au moins un revenu doit être renseigné
        const totalDemandeur = (data.revenus_salaire_demandeur || 0) + 
                              (data.revenus_pension_demandeur || 0) + 
                              (data.revenus_chomage_demandeur || 0) + 
                              (data.revenus_autres_demandeur || 0);
        
        if (totalDemandeur === 0 && !data.conjoint_revenus) {
          errors.revenus_general = 'Au moins un revenu doit être renseigné';
        }
        break;
    }
    
    return errors;
  };

  const handleNext = () => {
    const currentData = formData[`etape${currentStep}` as keyof typeof formData];
    const stepErrors = validateStep(currentStep, currentData);
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setErrors({});
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finaliser la demande
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleStepChange = (data: any) => {
    setFormData(prev => ({
      ...prev,
      [`etape${currentStep}`]: data
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Générer les données de confirmation
      const confirmationData = {
        numeroReference: `AVC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        dateSubmission: new Date(),
        estimationMontant: calculateEstimatedAmount(formData),
        delaiTraitement: "4 à 6 semaines",
        formData: formData
      };
      
      console.log('Données finales:', formData);
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Naviguer vers la page de confirmation avec les données
      navigate('/allocation-vie-chere/confirmation', {
        state: { confirmationData }
      });
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      data: formData[`etape${currentStep}` as keyof typeof formData] || {},
      onChange: handleStepChange,
      errors,
      session: session,
      onDocumentUpload: handleDocumentUpload,
      aiProcessing: aiProcessing
    };

    switch (currentStep) {
      case 1:
        return <DemandeurPrincipalStep {...stepProps} />;
      case 2:
        return <CompositionMenageStep {...stepProps} />;
      case 3:
        return <LogementStep {...stepProps} />;
      case 4:
        return <RevenusStep {...stepProps} />;
      case 5:
        return <DocumentsStep {...stepProps} />;
      default:
        return <DemandeurPrincipalStep {...stepProps} />;
    }
  };

  // ===============================================
  // TRAITEMENT IA DES DOCUMENTS
  // ===============================================

  const handleDocumentUpload = async (file: File, documentType: string) => {
    if (!session?.consentements.ia_externe) {
      // Mode sans IA : juste uploader
      return { success: true, message: t('document.uploaded.without.ai') };
    }

    try {
      setAiProcessing(true);
      
      let result;
      switch (documentType) {
        case 'rib':
          result = await aiService.processRIB(file, session.id);
          break;
        case 'fiche_paie':
          result = await aiService.processFichePaie(file, session.id);
          break;
        case 'piece_identite':
          result = await aiService.processPieceIdentite(file, session.id);
          break;
        default:
          throw new Error('Type de document non supporté');
      }
      
      // Enregistrer les résultats IA
      setAiResults(prev => [...prev, {
        documentType,
        fileName: file.name,
        result,
        timestamp: new Date()
      }]);
      
      // Pré-remplir le formulaire avec les données extraites
      if (result.extractedData) {
        updateFormWithAIData(result.extractedData, documentType);
      }
      
      return { 
        success: true, 
        confidence: result.confidence,
        extractedData: result.extractedData,
        suggestions: result.suggestions
      };
      
    } catch (error: any) {
      console.error('Erreur traitement IA:', error);
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setAiProcessing(false);
    }
  };

  const updateFormWithAIData = (extractedData: any, documentType: string) => {
    const updates: any = {};
    
    switch (documentType) {
      case 'rib':
        if (extractedData.iban) {
          updates.iban = extractedData.iban;
        }
        break;
      case 'piece_identite':
        if (extractedData.nom) updates.nom = extractedData.nom;
        if (extractedData.prenom) updates.prenom = extractedData.prenom;
        if (extractedData.matricule) updates.matricule = extractedData.matricule;
        if (extractedData.adresse) {
          updates.adresse_rue = extractedData.adresse;
        }
        break;
      case 'fiche_paie':
        if (extractedData.salaire_net) {
          updates.revenus_salaire_demandeur = extractedData.salaire_net;
        }
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        [`etape${currentStep + 1}`]: {
          ...prev[`etape${currentStep + 1}` as keyof FormData],
          ...updates
        }
      }));
    }
  };

  // ===============================================
  // FINALISATION ET NETTOYAGE RGPD
  // ===============================================

  const calculateEstimatedAmount = (formData: FormData): number => {
    // Calcul simple basé sur la composition du ménage et les revenus
    const revenus = formData.etape4?.total_revenus_menage || 0;
    const nbPersonnes = formData.etape2?.total_personnes_menage || 1;
    const nbEnfants = (formData.etape2?.nombre_enfants_0_17 || 0) + (formData.etape2?.nombre_enfants_18_24 || 0);
    
    // Seuils indicatifs 2025 (basé sur le script SQL)
    const seuil1Personne = 2500;
    const seuilParPersonne = 750;
    const seuil = seuil1Personne + (nbPersonnes - 1) * seuilParPersonne;
    
    if (revenus <= seuil) {
      // Montant de base + majoration enfants
      const montantBase = nbPersonnes === 1 ? 200 : 300;
      const majorationEnfants = nbEnfants * 100;
      return Math.min(montantBase + majorationEnfants, 800); // Plafond max
    }
    
    return 0; // Non éligible
  };

  const generateOfficialForm = async (formData: FormData): Promise<Blob> => {
    // Simulation de génération du formulaire officiel luxembourgeois
    // En réalité, on utiliserait une librairie comme PDFKit ou jsPDF
    
    const formContent = `
      FONDS NATIONAL DE SOLIDARITÉ
      ALLOCATION DE VIE CHÈRE 2025
      
      ═══════════════════════════════════════════════════════════
      
      1. DEMANDEUR PRINCIPAL
      ───────────────────────────────────────────────────────────
      Civilité : ${formData.etape1?.civilite || '[À COMPLÉTER]'}
      Nom : ${formData.etape1?.nom || '[À COMPLÉTER]'}
      Prénom : ${formData.etape1?.prenom || '[À COMPLÉTER]'}
      Date de naissance : ${formData.etape1?.date_naissance || '[À COMPLÉTER]'}
      Matricule : ${formData.etape1?.matricule || '[À COMPLÉTER]'}
      Nationalité : ${formData.etape1?.nationalite || '[À COMPLÉTER]'}
      
      Adresse :
      ${formData.etape1?.adresse_rue || '[À COMPLÉTER]'}
      ${formData.etape1?.adresse_code_postal || '[À COMPLÉTER]'} ${formData.etape1?.adresse_commune || '[À COMPLÉTER]'}
      
      Contact :
      Téléphone : ${formData.etape1?.telephone || '[OPTIONNEL]'}
      E-mail : ${formData.etape1?.email || '[OPTIONNEL]'}
      
      2. COMPOSITION DU MÉNAGE
      ───────────────────────────────────────────────────────────
      Situation familiale : ${formData.etape2?.situation_familiale || '[À COMPLÉTER]'}
      Conjoint/partenaire : ${formData.etape2?.conjoint_present ? 'Oui' : 'Non'}
      Enfants 0-17 ans : ${formData.etape2?.nombre_enfants_0_17 || 0}
      Enfants 18-24 ans : ${formData.etape2?.nombre_enfants_18_24 || 0}
      Autres personnes : ${formData.etape2?.autres_personnes || 0}
      Total personnes ménage : ${formData.etape2?.total_personnes_menage || '[À COMPLÉTER]'}
      
      3. LOGEMENT
      ───────────────────────────────────────────────────────────
      Statut : ${formData.etape3?.statut_logement || '[À COMPLÉTER]'}
      Loyer mensuel : ${formData.etape3?.loyer_mensuel || '[SI APPLICABLE]'} €
      Charges mensuelles : ${formData.etape3?.charges_mensuelles || '[SI APPLICABLE]'} €
      Superficie : ${formData.etape3?.superficie_logement || '[OPTIONNEL]'} m²
      Nombre de pièces : ${formData.etape3?.nombre_pieces || '[OPTIONNEL]'}
      
      4. REVENUS ET RESSOURCES
      ───────────────────────────────────────────────────────────
      DEMANDEUR :
      - Salaire net : ${formData.etape4?.revenus_salaire_demandeur || 0} €
      - Pension/retraite : ${formData.etape4?.revenus_pension_demandeur || 0} €
      - Allocation chômage : ${formData.etape4?.revenus_chomage_demandeur || 0} €
      
      CONJOINT :
      - Salaire net : ${formData.etape4?.revenus_salaire_conjoint || 0} €
      - Pension/retraite : ${formData.etape4?.revenus_pension_conjoint || 0} €
      
      AUTRES REVENUS :
      - Allocations familiales : ${formData.etape4?.allocations_familiales || 0} €
      - Autres revenus : ${formData.etape4?.autres_revenus || 0} €
      
      TOTAL REVENUS MÉNAGE : ${formData.etape4?.total_revenus_menage || '[À CALCULER]'} €
      
      5. DOCUMENTS JOINTS
      ───────────────────────────────────────────────────────────
      ☐ RIB bancaire
      ☐ Justificatifs revenus demandeur
      ☐ Justificatifs revenus conjoint (si applicable)
      ☐ Pièce d'identité demandeur
      ☐ Pièce d'identité conjoint (si applicable)
      ☐ Justificatif de domicile
      
      ═══════════════════════════════════════════════════════════
      
      DÉCLARATION SUR L'HONNEUR
      
      Je soussigné(e) ${formData.etape1?.nom || '[NOM]'} ${formData.etape1?.prenom || '[PRÉNOM]'}, 
      certifie que les renseignements fournis dans cette demande sont 
      exacts et complets.
      
      Je m'engage à signaler tout changement dans ma situation.
      
      Date : ${new Date().toLocaleDateString('fr-LU')}
      
      Signature : _________________________
      
      ═══════════════════════════════════════════════════════════
      
      RÉSERVÉ À L'ADMINISTRATION
      
      Date de réception : _______________
      Numéro de dossier : _______________
      Décision : ☐ Accordé ☐ Refusé
      Montant mensuel : _________ €
      Date de prise d'effet : _______________
      
      Signature agent : _________________________
    `;
    
    return new Blob([formContent], { type: 'text/plain;charset=utf-8' });
  };

  // ===============================================
  // NETTOYAGE À LA FERMETURE
  // ===============================================

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (session) {
        await aiService.cleanupSession(session.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Nettoyage final
      if (session) {
        aiService.cleanupSession(session.id);
      }
    };
  }, [session, aiService]);

  // ===============================================
  // RENDU
  // ===============================================

  if (consentementDialog) {
    return (
      <ConsentementRGPD
        open={consentementDialog}
        onAccept={handleConsentementAccepte}
        langue={i18n.language}
        loading={loading}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* En-tête avec sécurité */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom>
                {t('allocation.vie.chere.titre')}
              </Typography>
              <Typography variant="subtitle1">
                {t('allocation.vie.chere.description')}
              </Typography>
            </Box>
            <SecurityIndicator level={securityLevel} />
          </Box>
        </CardContent>
      </Card>

      {/* Progression */}
      <ProgressionIndicator 
        currentStep={currentStep - 1} 
        steps={steps}
        progress={progress}
        onStepClick={handleNext}
      />

      {/* Indicateurs IA */}
      {session?.consentements.ia_externe && (
        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <SmartToy color="primary" />
              <Box flexGrow={1}>
                <Typography variant="h6">
                  {t('allocation.ia.assistant.titre', 'Assistant IA activé')}
                </Typography>
                <Typography variant="body2">
                  {t('allocation.ia.assistant.description', 'Scan automatique des documents et pré-remplissage intelligent')}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowAiDetails(!showAiDetails)}
                startIcon={showAiDetails ? <VisibilityOff /> : <Visibility />}
              >
                {showAiDetails ? t('common.hide') : t('common.show')}
              </Button>
            </Box>
            
            {showAiDetails && aiResults.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('allocation.ia.resultats', 'Résultats du traitement IA')}
                </Typography>
                <List dense>
                  {aiResults.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={result.fileName}
                        secondary={`Confiance: ${(result.result.confidence * 100).toFixed(1)}% - ${result.result.suggestions?.length || 0} suggestions`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertes et erreurs */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('validation.erreurs.titre', 'Veuillez corriger les erreurs suivantes :')}
          </Typography>
          <ul>
            {Object.values(errors).map((error: any, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Étape actuelle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            {steps[currentStep - 1].label}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {steps[currentStep - 1].description}
          </Typography>
          
          {aiProcessing && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" icon={<SmartToy />}>
                {t('allocation.ia.processing', 'Traitement IA en cours...')}
              </Alert>
              <LinearProgress sx={{ mt: 1 }} />
            </Box>
          )}
          
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          startIcon={<NavigateBefore />}
        >
          {t('common.back')}
        </Button>
        
        <Box display="flex" gap={2}>
          <Chip
            icon={<Shield />}
            label={t(`security.level.${securityLevel}`)}
            color={securityLevel === 'high' ? 'success' : securityLevel === 'medium' ? 'warning' : 'default'}
            size="small"
          />
          
          {session?.consentements.ia_externe && (
            <Chip
              icon={<SmartToy />}
              label={t('allocation.ia.active', 'IA Active')}
              color="info"
              size="small"
            />
          )}
        </Box>

        {currentStep === steps.length ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            color="success"
            size="large"
          >
            {loading ? t('common.processing') : t('allocation.submit', 'Finaliser la demande')}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {t('common.next')}
          </Button>
        )}
      </Box>

      {/* Informations de session (debug en développement) */}
      {process.env.NODE_ENV === 'development' && session && (
        <Card sx={{ mt: 3, bgcolor: 'grey.100' }}>
          <CardContent>
            <Typography variant="caption" display="block">
              Session: {session.id} | Expire: {session.expiresAt.toLocaleTimeString()}
            </Typography>
            <Typography variant="caption" display="block">
              Consentements: IA={session.consentements.ia_externe ? '✓' : '✗'} | 
              Traitement={session.consentements.traitement ? '✓' : '✗'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AllocationVieCherePage; 