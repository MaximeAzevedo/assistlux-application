import { useState, useEffect, useCallback } from 'react';
import { AllocationFormData, WizardState, ErreursValidation, EtapeValidation } from '../types/allocation';
import { ETAPES_WIZARD } from '../constants/allocation';
import { validateEtape, calculateProgress } from '../utils/validation';

const initialFormData: AllocationFormData = {
  etape1: {} as any,
  etape2: {} as any,
  etape3: {} as any,
  etape4: {} as any,
  etape5: {} as any
};

export const useAllocationForm = () => {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    formData: initialFormData,
    errors: {},
    loading: false,
    progress: 0,
    session: null,
    aiProcessing: false,
    aiResults: []
  });

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION ENTRE ÉTAPES
  // ═══════════════════════════════════════════════════════════

  const nextStep = useCallback(() => {
    if (state.currentStep < ETAPES_WIZARD.length) {
      const validation = validateEtape(state.currentStep, state.formData);
      
      if (validation.valide) {
        setState(prev => ({
          ...prev,
          currentStep: prev.currentStep + 1,
          errors: {}
        }));
      } else {
        setState(prev => ({
          ...prev,
          errors: validation.erreurs
        }));
      }
    }
  }, [state.currentStep, state.formData]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        errors: {}
      }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= ETAPES_WIZARD.length) {
      setState(prev => ({
        ...prev,
        currentStep: step,
        errors: {}
      }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // GESTION DES DONNÉES
  // ═══════════════════════════════════════════════════════════

  const updateStepData = useCallback(<T extends keyof AllocationFormData>(
    step: T,
    data: Partial<AllocationFormData[T]>
  ) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [step]: {
          ...prev.formData[step],
          ...data
        }
      }
    }));
  }, []);

  const updateCurrentStepData = useCallback((data: any) => {
    const stepKey = `etape${state.currentStep}` as keyof AllocationFormData;
    updateStepData(stepKey, data);
  }, [state.currentStep, updateStepData]);

  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: initialFormData,
      currentStep: 1,
      errors: {},
      progress: 0
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════

  const validateCurrentStep = useCallback((): EtapeValidation => {
    return validateEtape(state.currentStep, state.formData);
  }, [state.currentStep, state.formData]);

  const validateAllSteps = useCallback((): EtapeValidation[] => {
    return ETAPES_WIZARD.map((_, index) => 
      validateEtape(index + 1, state.formData)
    );
  }, [state.formData]);

  const isFormValid = useCallback((): boolean => {
    return validateAllSteps().every(step => step.valide);
  }, [validateAllSteps]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS D'ÉTAT
  // ═══════════════════════════════════════════════════════════

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setErrors = useCallback((errors: ErreursValidation) => {
    setState(prev => ({ ...prev, errors }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  const canGoNext = useCallback((): boolean => {
    const validation = validateCurrentStep();
    return validation.valide && state.currentStep < ETAPES_WIZARD.length;
  }, [validateCurrentStep, state.currentStep]);

  const canGoPrevious = useCallback((): boolean => {
    return state.currentStep > 1;
  }, [state.currentStep]);

  const isLastStep = useCallback((): boolean => {
    return state.currentStep === ETAPES_WIZARD.length;
  }, [state.currentStep]);

  const isFirstStep = useCallback((): boolean => {
    return state.currentStep === 1;
  }, [state.currentStep]);

  // ═══════════════════════════════════════════════════════════
  // PROGRESSION AUTO-CALCULÉE
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    const newProgress = calculateProgress(state.formData);
    setState(prev => ({ ...prev, progress: newProgress }));
  }, [state.formData]);

  // ═══════════════════════════════════════════════════════════
  // INTERFACE PUBLIQUE
  // ═══════════════════════════════════════════════════════════

  return {
    // État complet
    ...state,
    
    // Actions de navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Actions sur les données
    updateStepData,
    updateCurrentStepData,
    resetForm,
    
    // Validation
    validateCurrentStep,
    validateAllSteps,
    isFormValid,
    
    // Helpers d'état
    setLoading,
    setErrors,
    clearErrors,
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    
    // Informations calculées
    currentStepInfo: ETAPES_WIZARD[state.currentStep - 1],
    totalSteps: ETAPES_WIZARD.length,
    currentStepData: state.formData[`etape${state.currentStep}` as keyof AllocationFormData],
    
    // Props spécifiques par étape pour éviter les erreurs de types
    getStepData: <T extends keyof AllocationFormData>(stepKey: T) => state.formData[stepKey]
  };
};

export default useAllocationForm; 