import { ChampFormulaire, Document, StatistiqueValidation } from './FormConfigService';

export interface UserResponse {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'business' | 'coherence';
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: 'suggestion' | 'eligibility';
}

export class FormLogicService {
  private static instance: FormLogicService;

  public static getInstance(): FormLogicService {
    if (!FormLogicService.instance) {
      FormLogicService.instance = new FormLogicService();
    }
    return FormLogicService.instance;
  }

  /**
   * Évalue une condition d'affichage
   * @param condition - La condition à évaluer (ex: "SI_SALARIE", "TOUJOURS", "SI_LOCATAIRE")
   * @param userResponses - Les réponses de l'utilisateur
   * @returns true si la condition est remplie
   */
  evaluateDisplayCondition(condition: string | undefined, userResponses: UserResponse): boolean {
    if (!condition || condition === 'TOUJOURS') {
      return true;
    }

    try {
      switch (condition) {
        case 'SI_SALARIE':
          return this.hasValue(userResponses, 'revenu_salaire') && 
                 parseFloat(userResponses.revenu_salaire) > 0;

        case 'SI_LOCATAIRE':
          return userResponses.statut_logement === 'locataire';

        case 'SI_PROPRIETAIRE':
          return userResponses.statut_logement === 'proprietaire';

        case 'SI_DETENU':
          return userResponses.statut_special === 'detenu';

        case 'SI_REFUGIE':
          return userResponses.statut_special === 'refugie';

        case 'SI_MARIE':
          return userResponses.situation_familiale === 'marie';

        case 'SI_ENFANTS':
          return this.hasValue(userResponses, 'nb_enfants') && 
                 parseInt(userResponses.nb_enfants) > 0;

        case 'SI_CHOMEUR':
          return userResponses.statut_emploi === 'chomeur';

        case 'SI_RETRAITE':
          return userResponses.statut_emploi === 'retraite';

        case 'SI_ETUDIANT':
          return userResponses.statut_emploi === 'etudiant';

        // Conditions complexes avec opérateurs
        default:
          return this.evaluateComplexCondition(condition, userResponses);
      }
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la condition:', condition, error);
      return false;
    }
  }

  /**
   * Évalue une condition complexe avec opérateurs logiques
   */
  private evaluateComplexCondition(condition: string, userResponses: UserResponse): boolean {
    // Exemples de conditions complexes :
    // "revenu_total > 2000"
    // "age >= 18 AND statut_logement = 'locataire'"
    // "nb_enfants > 0 OR situation_familiale = 'marie'"

    try {
      // Remplacer les variables par leurs valeurs
      let evaluableCondition = condition;
      
      // Remplacer les variables par leurs valeurs
      Object.keys(userResponses).forEach(key => {
        const value = userResponses[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        
        if (typeof value === 'string') {
          evaluableCondition = evaluableCondition.replace(regex, `'${value}'`);
        } else {
          evaluableCondition = evaluableCondition.replace(regex, String(value));
        }
      });

      // Remplacer les opérateurs logiques
      evaluableCondition = evaluableCondition
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||')
        .replace(/\bNOT\b/g, '!')
        .replace(/=/g, '===');

      // Évaluer l'expression (attention : utilisation limitée d'eval pour les conditions simples)
      return this.safeEval(evaluableCondition);
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la condition complexe:', condition, error);
      return false;
    }
  }

  /**
   * Évaluation sécurisée d'expressions simples
   */
  private safeEval(expression: string): boolean {
    // Vérifier que l'expression ne contient que des opérateurs autorisés
    const allowedPattern = /^[0-9\s+\-*/<>=!&|()'"a-zA-Z_]+$/;
    if (!allowedPattern.test(expression)) {
      throw new Error('Expression non autorisée');
    }

    try {
      // eslint-disable-next-line no-eval
      return Boolean(eval(expression));
    } catch {
      return false;
    }
  }

  /**
   * Valide un champ selon ses règles
   */
  validateField(
    champ: ChampFormulaire, 
    value: any, 
    userResponses: UserResponse,
    validationRules?: StatistiqueValidation[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validation obligatoire
    if (champ.obligatoire && !this.hasValue(userResponses, champ.nom)) {
      errors.push({
        field: champ.nom,
        message: `Le champ ${champ.nom} est obligatoire`,
        type: 'required'
      });
    }

    if (!this.hasValue(userResponses, champ.nom)) {
      return { isValid: errors.length === 0, errors, warnings };
    }

    // 2. Validation de format
    if (champ.validation_regex) {
      const regex = new RegExp(champ.validation_regex);
      if (!regex.test(String(value))) {
        errors.push({
          field: champ.nom,
          message: `Format invalide pour ${champ.nom}`,
          type: 'format'
        });
      }
    }

    // 3. Validation par type
    switch (champ.type) {
      case 'email':
        if (!this.isValidEmail(String(value))) {
          errors.push({
            field: champ.nom,
            message: 'Adresse email invalide',
            type: 'format'
          });
        }
        break;

      case 'tel':
        if (!this.isValidPhone(String(value))) {
          errors.push({
            field: champ.nom,
            message: 'Numéro de téléphone invalide',
            type: 'format'
          });
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          errors.push({
            field: champ.nom,
            message: 'Valeur numérique requise',
            type: 'format'
          });
        }
        break;

      case 'date':
        if (!this.isValidDate(String(value))) {
          errors.push({
            field: champ.nom,
            message: 'Date invalide',
            type: 'format'
          });
        }
        break;
    }

    // 4. Validations métier spécifiques
    this.validateBusinessRules(champ.nom, value, userResponses, errors, warnings);

    // 5. Validations personnalisées depuis la base
    if (validationRules) {
      validationRules
        .filter(rule => rule.champ === champ.nom)
        .forEach(rule => {
          if (!this.evaluateValidationRule(rule.regle, value, userResponses)) {
            errors.push({
              field: champ.nom,
              message: rule.message_erreur,
              type: 'business'
            });
          }
        });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validations métier spécifiques au Luxembourg
   */
  private validateBusinessRules(
    fieldName: string, 
    value: any, 
    userResponses: UserResponse, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    switch (fieldName) {
      case 'matricule':
        if (!this.isValidLuxembourgMatricule(String(value))) {
          errors.push({
            field: fieldName,
            message: 'Matricule luxembourgeois invalide (13 chiffres requis)',
            type: 'business'
          });
        }
        break;

      case 'nb_enfants':
        const nbEnfants = parseInt(value);
        const nbPersonnes = parseInt(userResponses.nb_personnes);
        if (nbPersonnes && nbEnfants > nbPersonnes) {
          errors.push({
            field: fieldName,
            message: 'Le nombre d\'enfants ne peut pas dépasser le nombre de personnes',
            type: 'coherence'
          });
        }
        break;

      case 'revenu_total':
        const revenu = parseFloat(value);
        if (revenu < 0) {
          errors.push({
            field: fieldName,
            message: 'Le revenu ne peut pas être négatif',
            type: 'business'
          });
        }
        if (revenu > 10000) {
          warnings.push({
            field: fieldName,
            message: 'Revenu élevé - vérifiez votre éligibilité aux aides',
            type: 'eligibility'
          });
        }
        break;

      case 'age':
        const age = parseInt(value);
        if (age < 0 || age > 120) {
          errors.push({
            field: fieldName,
            message: 'Âge invalide',
            type: 'business'
          });
        }
        if (age < 18) {
          warnings.push({
            field: fieldName,
            message: 'Certaines aides sont réservées aux majeurs',
            type: 'eligibility'
          });
        }
        break;
    }
  }

  /**
   * Évalue une règle de validation personnalisée
   */
  private evaluateValidationRule(rule: string, value: any, userResponses: UserResponse): boolean {
    try {
      // Remplacer la valeur courante
      let evaluableRule = rule.replace(/\bvalue\b/g, String(value));
      
      // Remplacer les autres variables
      Object.keys(userResponses).forEach(key => {
        const val = userResponses[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evaluableRule = evaluableRule.replace(regex, String(val));
      });

      return this.safeEval(evaluableRule);
    } catch {
      return true; // En cas d'erreur, on considère la règle comme valide
    }
  }

  /**
   * Filtre les documents selon les conditions d'affichage
   */
  filterDocuments(documents: Document[], userResponses: UserResponse): Document[] {
    return documents.filter(doc => 
      this.evaluateDisplayCondition(doc.condition_affichage, userResponses)
    );
  }

  /**
   * Calcule l'éligibilité selon les barèmes
   */
  checkEligibility(userResponses: UserResponse, baremes: any[]): {
    eligible: boolean;
    reasons: string[];
    score: number;
  } {
    const reasons: string[] = [];
    let score = 0;
    let eligible = true;

    baremes.forEach(bareme => {
      const value = userResponses[bareme.type];
      
      if (bareme.seuil_max && value > bareme.seuil_max) {
        eligible = false;
        reasons.push(`${bareme.type} trop élevé (${value} > ${bareme.seuil_max})`);
      }
      
      if (bareme.seuil_min && value < bareme.seuil_min) {
        eligible = false;
        reasons.push(`${bareme.type} trop faible (${value} < ${bareme.seuil_min})`);
      }

      // Calcul du score (plus proche des seuils = meilleur score)
      if (bareme.seuil_max) {
        score += Math.max(0, (bareme.seuil_max - value) / bareme.seuil_max * 100);
      }
    });

    return { eligible, reasons, score: Math.round(score / baremes.length) };
  }

  // Utilitaires de validation
  private hasValue(obj: any, key: string): boolean {
    return obj[key] !== undefined && obj[key] !== null && obj[key] !== '';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Format luxembourgeois : +352 XX XX XX XX ou XX XX XX XX
    const phoneRegex = /^(\+352\s?)?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  private isValidLuxembourgMatricule(matricule: string): boolean {
    // Matricule luxembourgeois : 13 chiffres
    const matriculeRegex = /^[0-9]{13}$/;
    return matriculeRegex.test(matricule);
  }

  /**
   * Adapte le parcours selon le profil utilisateur
   */
  adaptUserJourney(userResponses: UserResponse, etapes: any[]): any[] {
    const statut = userResponses.statut_special;

    switch (statut) {
      case 'detenu':
        // Parcours simplifié pour les détenus : seulement sections A et E
        return etapes.filter(etape => 
          etape.nom === 'INTRO' || 
          etape.nom === 'INFO_PERSO' || 
          etape.nom === 'AFFAIRE' ||
          etape.nom === 'DOCUMENTS' ||
          etape.nom === 'ENVOI'
        );

      case 'refugie':
        // Parcours adapté pour les réfugiés
        return etapes.map(etape => ({
          ...etape,
          // Marquer certaines étapes comme optionnelles
          obligatoire: etape.nom === 'REVENUS' ? false : etape.obligatoire
        }));

      default:
        // Parcours complet standard
        return etapes;
    }
  }
}

// Export de l'instance singleton
export const formLogicService = FormLogicService.getInstance(); 