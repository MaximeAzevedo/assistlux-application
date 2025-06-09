import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  Download,
  Print,
  Email,
  Home,
  Info,
  Security,
  Schedule,
  PictureAsPdf,
  Error,
  Send,
  Calculate
} from '@mui/icons-material';
import { pdfFormService } from '../../services/AllocationVieChere/pdfFormService';

interface ConfirmationData {
  numeroReference: string;
  dateSubmission: Date;
  estimationMontant: number;
  delaiTraitement: string;
  formData: any;
}

const AllocationVieChereConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfAnalyzing, setPdfAnalyzing] = useState(false);
  const [pdfFieldsAnalyzed, setPdfFieldsAnalyzed] = useState<string[]>([]);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [showEligibilityDialog, setShowEligibilityDialog] = useState(false);

  useEffect(() => {
    // Récupérer les données de confirmation depuis l'état de navigation
    const data = location.state?.confirmationData;
    if (data) {
      setConfirmationData(data);
      // Analyser le formulaire PDF au chargement
      analyzePDFForm();
    } else {
      // Rediriger si pas de données
      navigate('/allocation-vie-chere');
    }
  }, [location.state, navigate]);

  /**
   * Analyse le formulaire PDF officiel pour découvrir ses champs
   */
  const analyzePDFForm = async () => {
    setPdfAnalyzing(true);
    try {
      console.log('🔍 Analyse du formulaire PDF officiel...');
      const fields = await pdfFormService.analyzeFormFields();
      setPdfFieldsAnalyzed(fields);
      console.log(`✅ ${fields.length} champs découverts dans le PDF`);
    } catch (error) {
      console.error('❌ Erreur analyse PDF:', error);
    } finally {
      setPdfAnalyzing(false);
    }
  };

  const generatePDF = async () => {
    setPdfGenerating(true);
    try {
      if (!confirmationData?.formData) {
        throw new Error('Données du formulaire manquantes');
      }

      console.log('📄 Génération du formulaire PDF officiel pré-rempli...');
      
      // Convertir nos données au format PDF
      const pdfData = pdfFormService.convertFormDataToPDF(confirmationData.formData);
      console.log('📋 Données converties:', pdfData);
      
      // Générer le PDF pré-rempli
      const pdfBytes = await pdfFormService.fillForm(pdfData);
      
      // Créer le blob et télécharger
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const fileName = pdfFormService.generateFileName(pdfData);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      // Nettoyer l'URL
      URL.revokeObjectURL(url);
      
      console.log(`✅ Formulaire PDF téléchargé: ${fileName}`);
      
    } catch (error: any) {
      console.error('❌ Erreur génération PDF:', error);
      alert(`Erreur lors de la génération du PDF: ${error.message}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Seuils d'éligibilité 2025 (exemple)
  const seuilsEligibilite = {
    1: 3500,  // 1 personne
    2: 5250,  // 2 personnes
    3: 6300,  // 3 personnes
    4: 7350,  // 4 personnes
    5: 8400,  // 5 personnes
    6: 9450,  // 6 personnes
    7: 10500, // 7 personnes
    8: 11550  // 8+ personnes
  };

  // Calcul d'éligibilité
  useEffect(() => {
    if (confirmationData?.formData?.etape2?.total_personnes_menage && confirmationData?.formData?.etape4?.total_revenus_menage !== undefined) {
      const nbPersonnes = Math.min(confirmationData.formData.etape2.total_personnes_menage, 8);
      const seuilApplicable = seuilsEligibilite[nbPersonnes as keyof typeof seuilsEligibilite];
      const revenus = confirmationData.formData.etape4.total_revenus_menage;
      
      const eligible = revenus <= seuilApplicable;
      const pourcentageSeuil = (revenus / seuilApplicable) * 100;
      
      let montantEstime = 0;
      if (eligible) {
        // Calcul simplifié du montant (exemple)
        const tauxAllocation = Math.max(0.1, 1 - (revenus / seuilApplicable));
        montantEstime = Math.round(tauxAllocation * 200 * nbPersonnes);
      }

      setEligibilityResult({
        eligible,
        revenus,
        seuil: seuilApplicable,
        pourcentageSeuil,
        montantEstime,
        nbPersonnes
      });
    }
  }, [confirmationData]);

  const getEligibilityColor = () => {
    if (!eligibilityResult) return 'info';
    return eligibilityResult.eligible ? 'success' : 'error';
  };

  const getEligibilityIcon = () => {
    if (!eligibilityResult) return <Info />;
    return eligibilityResult.eligible ? <CheckCircle /> : <Error />;
  };

  const etapesProcess = [
    { label: 'Soumission', status: 'completed' },
    { label: 'Vérification', status: 'pending' },
    { label: 'Traitement', status: 'pending' },
    { label: 'Décision', status: 'pending' },
    { label: 'Paiement', status: 'pending' }
  ];

  if (!confirmationData) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          Aucune donnée de confirmation trouvée. Veuillez refaire votre demande.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/allocation-vie-chere')}
          sx={{ mt: 2 }}
        >
          Nouvelle demande
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* En-tête de confirmation */}
      <Card sx={{ mb: 3, bgcolor: 'success.main', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircle sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                🎉 Demande soumise avec succès !
              </Typography>
              <Typography variant="h6">
                Votre allocation de vie chère a été enregistrée
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                Référence : <strong>{confirmationData.numeroReference}</strong>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 Prochaines étapes importantes
        </Typography>
        <Typography variant="body2">
          • Votre dossier sera traité dans un délai de <strong>{confirmationData.delaiTraitement}</strong><br/>
          • Vous recevrez un accusé de réception par courrier postal<br/>
          • La décision vous sera communiquée par courrier recommandé<br/>
          • Conservez précieusement votre numéro de référence
        </Typography>
      </Alert>

      {/* Résultat d'éligibilité */}
      {eligibilityResult && (
        <Card sx={{ mb: 3, bgcolor: `${getEligibilityColor()}.light` }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              {getEligibilityIcon()}
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {eligibilityResult.eligible ? '✅ Vous êtes éligible !' : '❌ Non éligible'}
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Revenus du ménage :</strong> {eligibilityResult.revenus.toFixed(2)} €/mois
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Seuil applicable :</strong> {eligibilityResult.seuil.toFixed(2)} €/mois
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Taille du ménage :</strong> {eligibilityResult.nbPersonnes} personne(s)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Pourcentage du seuil :</strong> {eligibilityResult.pourcentageSeuil.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>

            {eligibilityResult.eligible && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  💰 Montant estimé : {eligibilityResult.montantEstime} €
                </Typography>
                <Typography variant="body2">
                  Ce montant est une estimation. Le montant final sera déterminé par l'administration.
                </Typography>
              </Alert>
            )}

            {!eligibilityResult.eligible && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Vos revenus dépassent le seuil d'éligibilité de {(eligibilityResult.pourcentageSeuil - 100).toFixed(1)}%.
                  Vous pouvez tout de même soumettre votre demande qui sera examinée individuellement.
                </Typography>
              </Alert>
            )}

            <Button
              variant="outlined"
              onClick={() => setShowEligibilityDialog(true)}
              sx={{ mt: 2 }}
              startIcon={<Calculate />}
            >
              Voir le détail du calcul
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Récapitulatif des données */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Récapitulatif de votre demande
          </Typography>
          
          {/* Étape 1 - Demandeur */}
          {confirmationData.formData?.etape1 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                👤 Demandeur principal
              </Typography>
              <Typography variant="body2">
                {confirmationData.formData.etape1.prenom} {confirmationData.formData.etape1.nom}
              </Typography>
              <Typography variant="body2">
                Matricule : {confirmationData.formData.etape1.matricule_national}
              </Typography>
              <Typography variant="body2">
                Né(e) le : {confirmationData.formData.etape1.date_naissance}
              </Typography>
            </Box>
          )}

          {/* Étape 2 - Ménage */}
          {confirmationData.formData?.etape2 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                👨‍👩‍👧‍👦 Composition du ménage
              </Typography>
              <Typography variant="body2">
                Situation : {confirmationData.formData.etape2.situation_familiale}
              </Typography>
              <Typography variant="body2">
                Total : {confirmationData.formData.etape2.total_personnes_menage} personne(s)
              </Typography>
              {confirmationData.formData.etape2.nombre_enfants_0_17 > 0 && (
                <Typography variant="body2">
                  Enfants 0-17 ans : {confirmationData.formData.etape2.nombre_enfants_0_17}
                </Typography>
              )}
            </Box>
          )}

          {/* Étape 3 - Logement */}
          {confirmationData.formData?.etape3 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                🏠 Logement
              </Typography>
              <Typography variant="body2">
                Statut : {confirmationData.formData.etape3.statut_logement}
              </Typography>
              {confirmationData.formData.etape3.total_logement_mensuel > 0 && (
                <Typography variant="body2">
                  Coût mensuel : {confirmationData.formData.etape3.total_logement_mensuel.toFixed(2)} €
                </Typography>
              )}
            </Box>
          )}

          {/* Étape 4 - Revenus */}
          {confirmationData.formData?.etape4 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                💰 Revenus
              </Typography>
              <Typography variant="body2">
                Total ménage : {confirmationData.formData.etape4.total_revenus_menage.toFixed(2)} €/mois
              </Typography>
              <Typography variant="body2">
                Demandeur : {confirmationData.formData.etape4.total_revenus_demandeur.toFixed(2)} €
              </Typography>
              {confirmationData.formData.etape4.conjoint_revenus && (
                <Typography variant="body2">
                  Conjoint : {confirmationData.formData.etape4.total_revenus_conjoint.toFixed(2)} €
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions disponibles */}
      <Box display="flex" gap={3} sx={{ mb: 3 }}>
        {/* Résumé de la demande */}
        <Box sx={{ flexGrow: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                📄 Résumé de votre demande
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon><Info /></ListItemIcon>
                  <ListItemText
                    primary="Numéro de référence"
                    secondary={confirmationData.numeroReference}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><Schedule /></ListItemIcon>
                  <ListItemText
                    primary="Date de soumission"
                    secondary={confirmationData.dateSubmission.toLocaleDateString('fr-LU')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><Security /></ListItemIcon>
                  <ListItemText
                    primary="Sécurité RGPD"
                    secondary="Données traitées en conformité totale"
                  />
                  <Chip label="✓ Conforme" color="success" size="small" />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                💰 Estimation préliminaire
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Basée sur les informations fournies, votre allocation pourrait être d'environ :
              </Typography>
              <Typography variant="h4" color="success.main" gutterBottom>
                {confirmationData.estimationMontant > 0 
                  ? `${confirmationData.estimationMontant}€/mois`
                  : 'En cours de calcul'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                * Montant indicatif soumis à validation finale
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Actions disponibles */}
        <Box sx={{ minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📥 Actions disponibles
              </Typography>
              
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>📋 Formulaire officiel pré-rempli prêt !</strong><br/>
                  Téléchargez votre formulaire PDF avec toutes vos données déjà saisies.
                </Typography>
              </Alert>

              {/* Analyse du PDF */}
              {pdfAnalyzing && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">
                      Analyse du formulaire PDF officiel en cours...
                    </Typography>
                  </Box>
                </Alert>
              )}

              {pdfFieldsAnalyzed.length > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>✅ Formulaire PDF analysé :</strong><br/>
                    {pdfFieldsAnalyzed.length} champs détectés dans le formulaire officiel
                  </Typography>
                </Alert>
              )}
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={pdfGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                  onClick={generatePDF}
                  disabled={pdfGenerating || pdfAnalyzing}
                  size="large"
                  sx={{ 
                    bgcolor: 'error.main',
                    '&:hover': { bgcolor: 'error.dark' },
                    py: 1.5
                  }}
                >
                  {pdfGenerating ? 'Génération PDF...' : 'Télécharger le formulaire PDF officiel'}
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  📄 Format : PDF officiel pré-rempli • 🔒 Données sécurisées RGPD
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                >
                  Imprimer cette page
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  onClick={() => window.location.href = 'mailto:allocation@fns.lu?subject=Demande%20allocation%20vie%20chère%20' + confirmationData.numeroReference}
                >
                  Contacter le service
                </Button>
                
                <Divider sx={{ my: 1 }} />
                
                <Button
                  variant="text"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                  color="primary"
                >
                  Retour à l'accueil
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Processus de traitement */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            🔄 Suivi du processus de traitement
          </Typography>
          
          <Stepper activeStep={0} sx={{ mt: 2 }}>
            {etapesProcess.map((etape, index) => (
              <Step key={etape.label} completed={etape.status === 'completed'}>
                <StepLabel>
                  {etape.label}
                  {index === 0 && <Chip label="Actuel" color="success" size="small" sx={{ ml: 1 }} />}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Votre dossier est actuellement en phase de vérification. 
              Vous serez notifié par courrier de chaque étape importante.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Informations de contact */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          📞 Besoin d'aide ?
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Fonds national de solidarité</strong><br/>
          138, boulevard de la Pétrusse<br/>
          L-2330 Luxembourg<br/>
          <br/>
          Tél : (+352) 24 78 61 81<br/>
          Email : allocation@fns.lu<br/>
          Heures d'ouverture : Lundi - Vendredi, 8h30 - 11h30 et 13h30 - 16h30
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Référence à mentionner : {confirmationData.numeroReference}
        </Typography>
      </Paper>

      {/* Dialog détail calcul */}
      <Dialog open={showEligibilityDialog} onClose={() => setShowEligibilityDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Calculate sx={{ mr: 1 }} />
          Détail du calcul d'éligibilité
        </DialogTitle>
        <DialogContent>
          {eligibilityResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Seuils d'éligibilité 2025
              </Typography>
              
              <Typography variant="body2" paragraph>
                Les seuils d'éligibilité sont déterminés selon la taille du ménage :
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                {Object.entries(seuilsEligibilite).map(([personnes, seuil]) => (
                  <Typography 
                    key={personnes} 
                    variant="body2"
                    sx={{ 
                      fontWeight: parseInt(personnes) === eligibilityResult.nbPersonnes ? 'bold' : 'normal',
                      color: parseInt(personnes) === eligibilityResult.nbPersonnes ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {personnes} personne(s) : {seuil} €/mois
                    {parseInt(personnes) === eligibilityResult.nbPersonnes && ' ← Votre situation'}
                  </Typography>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Votre calcul
              </Typography>
              
              <Typography variant="body2">
                • Revenus de votre ménage : <strong>{eligibilityResult.revenus.toFixed(2)} €/mois</strong>
              </Typography>
              <Typography variant="body2">
                • Seuil pour {eligibilityResult.nbPersonnes} personne(s) : <strong>{eligibilityResult.seuil.toFixed(2)} €/mois</strong>
              </Typography>
              <Typography variant="body2">
                • Pourcentage du seuil : <strong>{eligibilityResult.pourcentageSeuil.toFixed(1)}%</strong>
              </Typography>
              
              <Alert severity={eligibilityResult.eligible ? 'success' : 'warning'} sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {eligibilityResult.eligible 
                    ? `✅ Vous êtes éligible car vos revenus sont inférieurs au seuil de ${(100 - eligibilityResult.pourcentageSeuil).toFixed(1)}%.`
                    : `❌ Vous n'êtes pas éligible car vos revenus dépassent le seuil de ${(eligibilityResult.pourcentageSeuil - 100).toFixed(1)}%.`
                  }
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEligibilityDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllocationVieChereConfirmation; 