// Hook principal pour la préparation documents logement social

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LogementSocialState, 
  ReponseQuestionnaire, 
  DocumentAvecStatut, 
  PopupContent,
  LangueVideo 
} from '../types/logementSocial';
import { DOCUMENTS } from '../constants/logementSocial';

// ═══════════════════════════════════════════════════════════
// LOGIQUE CONDITIONNELLE POUR GÉNÉRATION DES DOCUMENTS
// ═══════════════════════════════════════════════════════════

const evaluateConditions = (conditions: string[], reponses: ReponseQuestionnaire): boolean => {
  if (conditions.length === 0) return true; // Toujours requis si pas de conditions

  return conditions.some(condition => {
    switch (condition) {
      // NATIONALITÉ
      case 'nationalite_hors_ue':
        return reponses.nationalite === 'hors_ue';
      case 'nationalite_ue':
        return reponses.nationalite === 'ue';
      case 'conjoint_non_luxembourgeois':
        return reponses.nationaliteConjoint && reponses.nationaliteConjoint !== 'luxembourgeoise';
      case 'enfants_non_luxembourgeois':
        return reponses.nationalite !== 'luxembourgeoise'; // Assume nationalité des enfants

      // SITUATION FAMILIALE
      case 'situation_couple':
        return reponses.situationFamiliale === 'couple';
      case 'situation_divorce':
        return reponses.situationFamiliale === 'divorce';
      case 'situation_couple_ou_enfants':
        return reponses.situationFamiliale === 'couple' || reponses.nombreEnfants > 0;

      // ENFANTS ET AUTRES PERSONNES
      case 'a_enfants':
        return reponses.nombreEnfants > 0;
      case 'a_autres_personnes':
        return reponses.autresPersonnes;

      // PENSIONS ALIMENTAIRES
      case 'percoit_pensions':
        return reponses.pensionAlimentaire === 'percoit' || reponses.pensionAlimentaire === 'les_deux';
      case 'verse_pensions':
        return reponses.pensionAlimentaire === 'verse' || reponses.pensionAlimentaire === 'les_deux';

      // LOGEMENT
      case 'situation_locataire':
        return reponses.situationLogement === 'locataire';
      case 'situation_sdf':
        return reponses.situationLogement === 'sdf';
      case 'situation_resiliation':
        return false; // À déterminer par une question additionnelle si nécessaire
      case 'situation_expulsion':
        return false; // À déterminer par une question additionnelle si nécessaire

      // SITUATIONS PARTICULIÈRES
      case 'situation_handicap':
        return reponses.situationParticuliere === 'handicap';
      case 'situation_regroupement_familial':
        return reponses.situationParticuliere === 'regroupement_familial';
      case 'situation_fermeture_logement':
        return false; // À déterminer par une question additionnelle si nécessaire

      default:
        return false;
    }
  });
};

// ═══════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════

export const useLogementSocial = () => {
  // ÉTAT PRINCIPAL
  const [state, setState] = useState<LogementSocialState>({
    etape: 'questionnaire',
    reponses: null,
    documentsRequis: [],
    progression: 0,
    langueVideo: 'fr',
    errors: {}
  });

  // ÉTAT POPUP
  const [popupContent, setPopupContent] = useState<PopupContent>({
    type: 'video',
    documentId: '',
    isOpen: false
  });

  // ═══════════════════════════════════════════════════════════
  // GÉNÉRATION DES DOCUMENTS SELON LES RÉPONSES
  // ═══════════════════════════════════════════════════════════

  const genererDocumentsRequis = useCallback((reponses: ReponseQuestionnaire): DocumentAvecStatut[] => {
    return DOCUMENTS
      .filter(doc => evaluateConditions(doc.conditions, reponses))
      .map(doc => ({
        ...doc,
        possede: false, // Par défaut, aucun document possédé
        notes: ''
      }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // ACTIONS QUESTIONNAIRE
  // ═══════════════════════════════════════════════════════════

  const terminerQuestionnaire = useCallback((reponses: ReponseQuestionnaire) => {
    const documentsRequis = genererDocumentsRequis(reponses);
    
    setState(prev => ({
      ...prev,
      etape: 'checklist',
      reponses,
      documentsRequis,
      progression: 0,
      errors: {}
    }));

    // Sauvegarder en localStorage
    localStorage.setItem('logement-social-reponses', JSON.stringify(reponses));
    localStorage.setItem('logement-social-documents', JSON.stringify(documentsRequis));
  }, [genererDocumentsRequis]);

  const retourQuestionnaire = useCallback(() => {
    setState(prev => ({
      ...prev,
      etape: 'questionnaire',
      reponses: null,
      documentsRequis: [],
      progression: 0,
      errors: {}
    }));

    // Nettoyer localStorage
    localStorage.removeItem('logement-social-reponses');
    localStorage.removeItem('logement-social-documents');
  }, []);

  // ═══════════════════════════════════════════════════════════
  // ACTIONS CHECKLIST
  // ═══════════════════════════════════════════════════════════

  const toggleDocument = useCallback((documentId: string) => {
    setState(prev => ({
      ...prev,
      documentsRequis: prev.documentsRequis.map(doc =>
        doc.id === documentId 
          ? { ...doc, possede: !doc.possede }
          : doc
      )
    }));
  }, []);

  const ajouterNote = useCallback((documentId: string, note: string) => {
    setState(prev => ({
      ...prev,
      documentsRequis: prev.documentsRequis.map(doc =>
        doc.id === documentId 
          ? { ...doc, notes: note }
          : doc
      )
    }));
  }, []);

  const changerLangueVideo = useCallback((langue: LangueVideo) => {
    setState(prev => ({ ...prev, langueVideo: langue }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // ACTIONS POPUP
  // ═══════════════════════════════════════════════════════════

  const ouvrirPopupVideo = useCallback((documentId: string) => {
    setPopupContent({
      type: 'video',
      documentId,
      langue: state.langueVideo,
      isOpen: true
    });
  }, [state.langueVideo]);

  const ouvrirPopupExemple = useCallback((documentId: string) => {
    setPopupContent({
      type: 'exemple',
      documentId,
      isOpen: true
    });
  }, []);

  const fermerPopup = useCallback(() => {
    setPopupContent(prev => ({ ...prev, isOpen: false }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CALCULS ET STATISTIQUES
  // ═══════════════════════════════════════════════════════════

  const statistiques = useMemo(() => {
    const documentsObligatoires = state.documentsRequis.filter(doc => doc.obligatoire);
    const documentsOptionnels = state.documentsRequis.filter(doc => !doc.obligatoire);
    
    const obligatoiresPossedes = documentsObligatoires.filter(doc => doc.possede);
    const optionnelsPossedes = documentsOptionnels.filter(doc => doc.possede);
    
    const total = state.documentsRequis.length;
    const possedes = state.documentsRequis.filter(doc => doc.possede).length;
    const pourcentageTotal = total > 0 ? Math.round((possedes / total) * 100) : 0;
    
    const obligatoiresComplets = documentsObligatoires.length > 0 
      ? Math.round((obligatoiresPossedes.length / documentsObligatoires.length) * 100)
      : 100;

    return {
      total,
      possedes,
      manquants: total - possedes,
      pourcentageTotal,
      obligatoiresComplets,
      documentsObligatoires: documentsObligatoires.length,
      obligatoiresPossedes: obligatoiresPossedes.length,
      documentsOptionnels: documentsOptionnels.length,
      optionnelsPossedes: optionnelsPossedes.length,
      pret: obligatoiresComplets === 100
    };
  }, [state.documentsRequis]);

  // ═══════════════════════════════════════════════════════════
  // CHARGEMENT DEPUIS LOCALSTORAGE AU DÉMARRAGE
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    const reponsesSauvees = localStorage.getItem('logement-social-reponses');
    const documentsSauves = localStorage.getItem('logement-social-documents');
    
    if (reponsesSauvees && documentsSauves) {
      try {
        const reponses = JSON.parse(reponsesSauvees);
        const documents = JSON.parse(documentsSauves);
        
        setState(prev => ({
          ...prev,
          etape: 'checklist',
          reponses,
          documentsRequis: documents
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des données sauvées:', error);
        // En cas d'erreur, nettoyer le localStorage
        localStorage.removeItem('logement-social-reponses');
        localStorage.removeItem('logement-social-documents');
      }
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // SAUVEGARDE AUTOMATIQUE DES CHANGEMENTS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (state.etape === 'checklist' && state.documentsRequis.length > 0) {
      localStorage.setItem('logement-social-documents', JSON.stringify(state.documentsRequis));
    }
  }, [state.documentsRequis, state.etape]);

  // ═══════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════

  const exporterDonnees = useCallback(() => {
    if (!state.reponses) return null;

    const documentsManquants = state.documentsRequis
      .filter(doc => !doc.possede)
      .map(doc => doc.nom);
    
    const documentsPresents = state.documentsRequis
      .filter(doc => doc.possede)
      .map(doc => doc.nom);

    return {
      reponses: state.reponses,
      documentsRequis: state.documentsRequis,
      dateGeneration: new Date().toISOString(),
      progression: statistiques.pourcentageTotal,
      documentsManquants,
      documentsPresents
    };
  }, [state.reponses, state.documentsRequis, statistiques.pourcentageTotal]);

  // ═══════════════════════════════════════════════════════════
  // RETOUR PUBLIC
  // ═══════════════════════════════════════════════════════════

  return {
    // État
    state,
    popupContent,
    statistiques,

    // Actions questionnaire
    terminerQuestionnaire,
    retourQuestionnaire,

    // Actions checklist
    toggleDocument,
    ajouterNote,
    changerLangueVideo,

    // Actions popup
    ouvrirPopupVideo,
    ouvrirPopupExemple,
    fermerPopup,

    // Utilitaires
    exporterDonnees,

    // Helpers
    isReady: state.etape !== 'questionnaire' || state.documentsRequis.length > 0
  };
};

export default useLogementSocial; 