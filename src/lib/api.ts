import { supabase } from './supabase/client';

export async function getData() {
  try {
    // Fetch data from the éligibilité table
    const { data, error } = await supabase
      .from('eligibility')
      .select('*')
      .order('Etape');

    if (error) throw error;
    if (!data) throw new Error('No data returned');

    // Transform the data into the expected format
    const questions = data
      .filter(row => row.Type_Noeud === 'question')
      .map(row => ({
        id: row.ID_Regle,
        question_key: row.Key_JSON_Question,
        question_type: row.Type_Reponse_Attendue?.toLowerCase() || 'single_select',
        input_order: row.Etape || 0,
        options: [
          row.Key_JSON_Option_A && { key: row.Key_JSON_Option_A, text: row.Texte_Option_A },
          row.Key_JSON_Option_B && { key: row.Key_JSON_Option_B, text: row.Texte_Option_B },
          row.Key_JSON_Option_C && { key: row.Key_JSON_Option_C, text: row.Texte_Option_C },
          row.Key_JSON_Option_D && { key: row.Key_JSON_Option_D, text: row.Texte_Option_D }
        ].filter(Boolean),
        question_fr: row.Question_Posee_Utilisateur || '',
        hint_fr: row.Texte_Conclusion_Ou_Info
      }));

    const aides = Array.from(new Set(data.map(row => row.Aide_Concernee)))
      .filter(Boolean)
      .map(aideName => ({
        id: aideName,
        aid_key: aideName,
        name_fr: aideName,
        description_fr: data.find(row => row.Aide_Concernee === aideName)?.Texte_Conclusion_Ou_Info || ''
      }));

    const rules = data
      .filter(row => row.Type_Noeud === 'conclusion' && row.Aide_Concernee)
      .map(row => ({
        id: row.ID_Regle,
        aid_id: row.Aide_Concernee,
        question_key: row.Key_JSON_Question,
        condition: row.Key_JSON_Conclusion
      }));

    return {
      questions,
      aides,
      rules
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}