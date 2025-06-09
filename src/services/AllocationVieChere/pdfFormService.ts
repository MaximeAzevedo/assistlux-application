// Service pour analyser et pré-remplir le formulaire PDF officiel
// Allocation de Vie Chère 2025 - Luxembourg
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup } from 'pdf-lib';

interface FormData {
  // Demandeur principal
  nom?: string;
  prenom?: string;
  matricule?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  adresse_rue?: string;
  adresse_numero?: string;
  adresse_code_postal?: string;
  adresse_localite?: string;
  telephone?: string;
  email?: string;
  
  // Situation familiale
  situation_familiale?: 'celibataire' | 'marie' | 'divorce' | 'veuf' | 'union_libre';
  nombre_enfants?: number;
  
  // Logement
  type_logement?: 'proprietaire' | 'locataire' | 'heberge';
  loyer_mensuel?: number;
  charges_mensuelles?: number;
  
  // Revenus
  salaire_net?: number;
  allocations_familiales?: number;
  autres_revenus?: number;
  total_revenus?: number;
  
  // Compte bancaire
  iban?: string;
  titulaire_compte?: string;
}

interface PDFFieldMapping {
  fieldName: string;
  dataKey: keyof FormData;
  type: 'text' | 'checkbox' | 'radio';
  transform?: (value: any) => string;
}

export class PDFFormService {
  private pdfBytes: Uint8Array | null = null;
  private fieldMappings: PDFFieldMapping[] = [];

  constructor() {
    this.initializeFieldMappings();
  }

  /**
   * Charge le formulaire PDF officiel
   */
  async loadOfficialForm(): Promise<void> {
    try {
      // Essayer de charger le PDF officiel depuis les assets
      const response = await fetch('/src/assets/templates/allocation-vie-chere-2025.pdf');
      if (response.ok) {
        this.pdfBytes = new Uint8Array(await response.arrayBuffer());
        console.log('✅ Formulaire PDF officiel chargé');
        
        // Analyser les champs du formulaire
        await this.analyzeFormFields();
        return;
      }
    } catch (error) {
      console.warn('⚠️ Formulaire PDF officiel non trouvé, création d\'un PDF simple');
    }
    
    // Fallback : créer un PDF simple avec nos données
    await this.createSimplePDF();
  }

  /**
   * Crée un PDF simple si le formulaire officiel n'est pas disponible
   */
  private async createSimplePDF(): Promise<void> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
      
      // Titre
      page.drawText('DEMANDE D\'ALLOCATION DE VIE CHÈRE 2025', {
        x: 50,
        y: 800,
        size: 16,
      });
      
      page.drawText('Fonds national de solidarité - Luxembourg', {
        x: 50,
        y: 780,
        size: 12,
      });
      
      // Placeholder pour les données
      page.drawText('Ce formulaire sera pré-rempli avec vos données...', {
        x: 50,
        y: 740,
        size: 10,
      });
      
      this.pdfBytes = await pdfDoc.save();
      console.log('✅ PDF simple créé en fallback');
      
    } catch (error) {
      console.error('❌ Erreur création PDF simple:', error);
      throw error;
    }
  }

  /**
   * Analyse les champs du formulaire PDF pour découvrir leur structure
   */
  async analyzeFormFields(): Promise<string[]> {
    if (!this.pdfBytes) {
      throw new Error('Formulaire PDF non chargé');
    }

    try {
      const pdfDoc = await PDFDocument.load(this.pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      console.log(`📋 Formulaire analysé: ${fields.length} champs trouvés`);
      
      const fieldNames: string[] = [];
      
      fields.forEach((field, index) => {
        const fieldName = field.getName();
        const fieldType = this.getFieldType(field);
        
        fieldNames.push(fieldName);
        console.log(`  ${index + 1}. ${fieldName} (${fieldType})`);
      });

      return fieldNames;
      
    } catch (error) {
      console.error('❌ Erreur analyse champs PDF:', error);
      throw error;
    }
  }

  /**
   * Pré-remplit le formulaire avec les données fournies
   */
  async fillForm(formData: FormData): Promise<Uint8Array> {
    console.log('📝 Début pré-remplissage avec données:', formData);
    
    // TOUJOURS utiliser notre PDF simple pré-rempli pour l'instant
    // car nous ne connaissons pas encore les vrais noms des champs du PDF officiel
    console.log('📝 Génération PDF simple pré-rempli (mode forcé)...');
    return await this.createPreFilledSimplePDF(formData);

    /* 
    // Code commenté temporairement - à réactiver quand on aura les vrais noms de champs
    if (!this.pdfBytes) {
      await this.loadOfficialForm();
    }

    try {
      const pdfDoc = await PDFDocument.load(this.pdfBytes!);
      const form = pdfDoc.getForm();

      console.log('📝 Pré-remplissage du formulaire...');
      
      // Si c'est un formulaire officiel avec des champs
      if (form.getFields().length > 0) {
        let filledFields = 0;

        // Parcourir tous les mappings et remplir les champs
        for (const mapping of this.fieldMappings) {
          try {
            const value = formData[mapping.dataKey];
            if (value !== undefined && value !== null && value !== '') {
              await this.fillField(form, mapping, value);
              filledFields++;
            }
          } catch (error) {
            console.warn(`⚠️ Impossible de remplir le champ ${mapping.fieldName}:`, error);
          }
        }

        console.log(`✅ ${filledFields} champs pré-remplis sur ${this.fieldMappings.length}`);
        
        // Si aucun champ n'a été rempli, utiliser le PDF simple
        if (filledFields === 0) {
          console.log('⚠️ Aucun champ pré-rempli, basculement vers PDF simple');
          return await this.createPreFilledSimplePDF(formData);
        }
      } else {
        // Mode simple : créer un PDF pré-rempli from scratch
        console.log('📝 Génération PDF simple pré-rempli...');
        return await this.createPreFilledSimplePDF(formData);
      }

      // Générer le PDF pré-rempli
      const pdfBytesResult = await pdfDoc.save();
      return pdfBytesResult;

    } catch (error) {
      console.error('❌ Erreur pré-remplissage formulaire:', error);
      // Fallback : créer un PDF simple avec les données
      return await this.createPreFilledSimplePDF(formData);
    }
    */
  }

  /**
   * Crée un PDF simple pré-rempli avec toutes les données
   */
  private async createPreFilledSimplePDF(formData: FormData): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
      let yPos = 800;
      
      // En-tête
      page.drawText('DEMANDE D\'ALLOCATION DE VIE CHÈRE 2025', {
        x: 50, y: yPos, size: 16,
      });
      yPos -= 20;
      
      page.drawText('Fonds national de solidarité - Luxembourg', {
        x: 50, y: yPos, size: 12,
      });
      yPos -= 40;

      // 1. DEMANDEUR PRINCIPAL
      page.drawText('1. DEMANDEUR PRINCIPAL', {
        x: 50, y: yPos, size: 14,
      });
      yPos -= 25;

      if (formData.nom) {
        page.drawText(`Nom : ${formData.nom}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.prenom) {
        page.drawText(`Prénom : ${formData.prenom}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.matricule) {
        page.drawText(`Matricule luxembourgeois : ${formData.matricule}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.date_naissance) {
        page.drawText(`Date de naissance : ${formData.date_naissance}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.nationalite) {
        page.drawText(`Nationalité : ${formData.nationalite}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }

      // Adresse
      if (formData.adresse_rue || formData.adresse_code_postal || formData.adresse_localite) {
        yPos -= 10;
        page.drawText('Adresse :', { x: 70, y: yPos, size: 10 });
        yPos -= 15;
        
        if (formData.adresse_rue) {
          page.drawText(`  ${formData.adresse_rue}`, { x: 70, y: yPos, size: 10 });
          yPos -= 15;
        }
        if (formData.adresse_code_postal && formData.adresse_localite) {
          page.drawText(`  ${formData.adresse_code_postal} ${formData.adresse_localite}`, { x: 70, y: yPos, size: 10 });
          yPos -= 15;
        }
      }

      // Contact
      if (formData.telephone) {
        page.drawText(`Téléphone : ${formData.telephone}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.email) {
        page.drawText(`Email : ${formData.email}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }

      // 2. SITUATION FAMILIALE
      yPos -= 20;
      page.drawText('2. SITUATION FAMILIALE', {
        x: 50, y: yPos, size: 14,
      });
      yPos -= 25;

      if (formData.situation_familiale) {
        page.drawText(`Situation : ${formData.situation_familiale}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.nombre_enfants !== undefined) {
        page.drawText(`Nombre d'enfants : ${formData.nombre_enfants}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }

      // 3. LOGEMENT
      yPos -= 20;
      page.drawText('3. LOGEMENT', {
        x: 50, y: yPos, size: 14,
      });
      yPos -= 25;

      if (formData.type_logement) {
        page.drawText(`Statut : ${formData.type_logement}`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.loyer_mensuel) {
        page.drawText(`Loyer mensuel : ${formData.loyer_mensuel}€`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.charges_mensuelles) {
        page.drawText(`Charges mensuelles : ${formData.charges_mensuelles}€`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }

      // 4. REVENUS
      yPos -= 20;
      page.drawText('4. REVENUS', {
        x: 50, y: yPos, size: 14,
      });
      yPos -= 25;

      if (formData.salaire_net) {
        page.drawText(`Salaire net : ${formData.salaire_net}€/mois`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.allocations_familiales) {
        page.drawText(`Allocations familiales : ${formData.allocations_familiales}€/mois`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.autres_revenus) {
        page.drawText(`Autres revenus : ${formData.autres_revenus}€/mois`, { x: 70, y: yPos, size: 10 });
        yPos -= 15;
      }
      if (formData.total_revenus) {
        page.drawText(`TOTAL REVENUS : ${formData.total_revenus}€/mois`, { x: 70, y: yPos, size: 11 });
        yPos -= 15;
      }

      // 5. COMPTE BANCAIRE
      if (formData.iban || formData.titulaire_compte) {
        yPos -= 20;
        page.drawText('5. COMPTE BANCAIRE', {
          x: 50, y: yPos, size: 14,
        });
        yPos -= 25;

        if (formData.iban) {
          page.drawText(`IBAN : ${formData.iban}`, { x: 70, y: yPos, size: 10 });
          yPos -= 15;
        }
        if (formData.titulaire_compte) {
          page.drawText(`Titulaire : ${formData.titulaire_compte}`, { x: 70, y: yPos, size: 10 });
          yPos -= 15;
        }
      }

      // Footer
      yPos -= 40;
      page.drawText('DÉCLARATION SUR L\'HONNEUR', {
        x: 50, y: yPos, size: 12,
      });
      yPos -= 20;
      
      page.drawText('Je soussigné(e) certifie que les renseignements fournis sont exacts et complets.', {
        x: 50, y: yPos, size: 10,
      });
      yPos -= 15;
      
      page.drawText('Je m\'engage à signaler tout changement dans ma situation.', {
        x: 50, y: yPos, size: 10,
      });
      yPos -= 30;
      
      page.drawText(`Date : ${new Date().toLocaleDateString('fr-LU')}`, {
        x: 50, y: yPos, size: 10,
      });
      
      page.drawText('Signature : _________________________', {
        x: 300, y: yPos, size: 10,
      });

      const pdfBytes = await pdfDoc.save();
      console.log('✅ PDF simple pré-rempli généré');
      return pdfBytes;
      
    } catch (error) {
      console.error('❌ Erreur création PDF simple pré-rempli:', error);
      throw error;
    }
  }

  /**
   * Remplit un champ spécifique selon son type
   */
  private async fillField(form: PDFForm, mapping: PDFFieldMapping, value: any): Promise<void> {
    try {
      const transformedValue = mapping.transform ? mapping.transform(value) : String(value);

      switch (mapping.type) {
        case 'text':
          const textField = form.getTextField(mapping.fieldName);
          textField.setText(transformedValue);
          break;

        case 'checkbox':
          const checkbox = form.getCheckBox(mapping.fieldName);
          if (value === true || value === 'true' || value === 1) {
            checkbox.check();
          } else {
            checkbox.uncheck();
          }
          break;

        case 'radio':
          const radioGroup = form.getRadioGroup(mapping.fieldName);
          radioGroup.select(transformedValue);
          break;
      }

      console.log(`  ✓ ${mapping.fieldName} = ${transformedValue}`);
      
    } catch (error) {
      // Le champ n'existe peut-être pas dans ce PDF
      console.warn(`  ⚠️ Champ ${mapping.fieldName} non trouvé ou incompatible`);
    }
  }

  /**
   * Initialise les mappings entre les champs PDF et nos données
   * À ajuster selon les vrais noms des champs du PDF officiel
   */
  private initializeFieldMappings(): void {
    this.fieldMappings = [
      // Identité du demandeur
      { fieldName: 'nom', dataKey: 'nom', type: 'text' },
      { fieldName: 'prenom', dataKey: 'prenom', type: 'text' },
      { fieldName: 'matricule', dataKey: 'matricule', type: 'text' },
      { fieldName: 'date_naissance', dataKey: 'date_naissance', type: 'text' },
      { fieldName: 'lieu_naissance', dataKey: 'lieu_naissance', type: 'text' },
      { fieldName: 'nationalite', dataKey: 'nationalite', type: 'text' },
      
      // Adresse
      { fieldName: 'adresse_rue', dataKey: 'adresse_rue', type: 'text' },
      { fieldName: 'adresse_numero', dataKey: 'adresse_numero', type: 'text' },
      { fieldName: 'code_postal', dataKey: 'adresse_code_postal', type: 'text' },
      { fieldName: 'localite', dataKey: 'adresse_localite', type: 'text' },
      
      // Contact
      { fieldName: 'telephone', dataKey: 'telephone', type: 'text' },
      { fieldName: 'email', dataKey: 'email', type: 'text' },
      
      // Situation familiale
      { fieldName: 'situation_familiale', dataKey: 'situation_familiale', type: 'radio' },
      { fieldName: 'nombre_enfants', dataKey: 'nombre_enfants', type: 'text', 
        transform: (val) => String(val || 0) },
      
      // Logement
      { fieldName: 'type_logement', dataKey: 'type_logement', type: 'radio' },
      { fieldName: 'loyer_mensuel', dataKey: 'loyer_mensuel', type: 'text',
        transform: (val) => val ? `${val}€` : '' },
      { fieldName: 'charges_mensuelles', dataKey: 'charges_mensuelles', type: 'text',
        transform: (val) => val ? `${val}€` : '' },
      
      // Revenus
      { fieldName: 'salaire_net', dataKey: 'salaire_net', type: 'text',
        transform: (val) => val ? `${val}€` : '' },
      { fieldName: 'allocations_familiales', dataKey: 'allocations_familiales', type: 'text',
        transform: (val) => val ? `${val}€` : '' },
      { fieldName: 'autres_revenus', dataKey: 'autres_revenus', type: 'text',
        transform: (val) => val ? `${val}€` : '' },
      { fieldName: 'total_revenus', dataKey: 'total_revenus', type: 'text',
        transform: (val) => val ? `${val}€` : '' },
      
      // Compte bancaire
      { fieldName: 'iban', dataKey: 'iban', type: 'text' },
      { fieldName: 'titulaire_compte', dataKey: 'titulaire_compte', type: 'text' },
    ];
  }

  /**
   * Détermine le type d'un champ PDF
   */
  private getFieldType(field: any): string {
    if (field.constructor.name.includes('TextField')) return 'text';
    if (field.constructor.name.includes('CheckBox')) return 'checkbox';
    if (field.constructor.name.includes('RadioGroup')) return 'radio';
    if (field.constructor.name.includes('DropdownField')) return 'dropdown';
    return 'unknown';
  }

  /**
   * Génère un nom de fichier pour le formulaire pré-rempli
   */
  generateFileName(formData: FormData): string {
    const date = new Date().toISOString().split('T')[0];
    const nom = formData.nom || 'anonyme';
    const prenom = formData.prenom || '';
    
    let fileName = `allocation-vie-chere-${date}`;
    
    if (nom && nom !== 'anonyme') {
      fileName += `-${nom}`;
    }
    if (prenom && prenom.trim()) {
      fileName += `-${prenom}`;
    }
    
    return `${fileName}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''); // supprimer les tirets en début/fin
  }

  /**
   * Convertit nos données de formulaire au format attendu
   */
  convertFormDataToPDF(wizardData: any): FormData {
    console.log('🔄 Conversion des données du wizard:', wizardData);
    
    return {
      // Étape 1 - Demandeur principal
      nom: wizardData.etape1?.nom,
      prenom: wizardData.etape1?.prenom,
      matricule: wizardData.etape1?.matricule,
      date_naissance: wizardData.etape1?.date_naissance,
      lieu_naissance: wizardData.etape1?.lieu_naissance,
      nationalite: wizardData.etape1?.nationalite || 'Luxembourgeoise',
      adresse_rue: wizardData.etape1?.adresse_rue,
      adresse_numero: wizardData.etape1?.adresse_numero,
      adresse_code_postal: wizardData.etape1?.adresse_code_postal,
      adresse_localite: wizardData.etape1?.adresse_commune,
      telephone: wizardData.etape1?.telephone,
      email: wizardData.etape1?.email,
      
      // Étape 2 - Composition ménage
      situation_familiale: wizardData.etape2?.situation_familiale,
      nombre_enfants: (wizardData.etape2?.nombre_enfants_0_17 || 0) + (wizardData.etape2?.nombre_enfants_18_24 || 0),
      
      // Étape 3 - Logement
      type_logement: wizardData.etape3?.statut_logement,
      loyer_mensuel: wizardData.etape3?.loyer_mensuel,
      charges_mensuelles: wizardData.etape3?.charges_mensuelles,
      
      // Étape 4 - Revenus
      salaire_net: wizardData.etape4?.revenus_salaire_demandeur,
      allocations_familiales: wizardData.etape4?.allocations_familiales,
      autres_revenus: wizardData.etape4?.revenus_autres_demandeur,
      total_revenus: wizardData.etape4?.total_revenus_menage,
      
      // Étape 5 - Documents (IBAN extrait)
      iban: wizardData.etape5?.iban,
      titulaire_compte: wizardData.etape5?.titulaire_compte || 
                       `${wizardData.etape1?.prenom} ${wizardData.etape1?.nom}`,
    };
  }
}

// Instance singleton
export const pdfFormService = new PDFFormService(); 