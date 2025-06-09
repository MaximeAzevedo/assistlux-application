import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://smfvnuvtbxtoocnqmabg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZnZudXZ0Ynh0b29jbnFtYWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDk3NjksImV4cCI6MjA2MjYyNTc2OX0.BgIgVj8T-vXz0X_rDQjv3oqh7nPT7m5X5Q5rU7xm1Dw'
);

async function testConnection() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    // Test questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .order('ordre')
      .limit(5);
    
    console.log('\n📋 Questions:');
    if (qError) {
      console.error('❌ Erreur questions:', qError.message);
    } else {
      console.log(`✅ ${questions?.length || 0} questions trouvées`);
      questions?.forEach(q => {
        console.log(`   ${q.ordre}. ${q.question} (${q.key_reponse})`);
        console.log(`      Type: ${q.type_reponse}, Condition: ${q.condition_affichage || 'none'}`);
      });
    }
    
    // Test conclusions
    const { data: conclusions, error: cError } = await supabase
      .from('conclusions')
      .select('*')
      .limit(5);
    
    console.log('\n🎯 Conclusions:');
    if (cError) {
      console.error('❌ Erreur conclusions:', cError.message);
    } else {
      console.log(`✅ ${conclusions?.length || 0} conclusions trouvées`);
      conclusions?.forEach(c => {
        console.log(`   • ${c.titre_aide} (${c.categorie})`);
        console.log(`     Condition: ${c.logic_condition}`);
      });
    }
    
    // Test avec des réponses d'exemple
    console.log('\n🧪 Test logique d\'éligibilité:');
    const testAnswers = {
      q_residence_lux: 'opt_oui',
      q_nationalite_cat: 'opt_A',
      q_sejour_legal_rnpp: 'opt_oui',
      q_age: 25,
      q_institution: 'opt_non',
      q_revenus_mensuels: 2500
    };
    
    console.log('Réponses test:', testAnswers);
    
    if (conclusions && conclusions.length > 0) {
      conclusions.forEach(conclusion => {
        const isEligible = evaluateCondition(conclusion.logic_condition, testAnswers);
        console.log(`   ${conclusion.titre_aide}: ${isEligible ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

function evaluateCondition(condition, answers) {
  if (!condition) return true;

  try {
    // Handle AND conditions
    if (condition.includes(' AND ')) {
      return condition
        .split(' AND ')
        .every(subCond => evaluateCondition(subCond.trim(), answers));
    }

    // Handle OR conditions
    if (condition.includes(' OR ')) {
      return condition
        .split(' OR ')
        .some(subCond => evaluateCondition(subCond.trim(), answers));
    }

    // Handle equality
    if (condition.includes(' = ')) {
      const [key, value] = condition.split(' = ').map(s => s.trim());
      return answers[key] === value;
    }

    // Handle numeric comparisons
    const matchNum = condition.match(/^(.+?)([><]=?)(.+)$/);
    if (matchNum) {
      const [, key, operator, valueStr] = matchNum;
      const value = parseFloat(valueStr.trim());
      const userValue = parseFloat(answers[key.trim()]);
      
      if (isNaN(value) || isNaN(userValue)) return false;
      
      switch (operator) {
        case '>': return userValue > value;
        case '>=': return userValue >= value;
        case '<': return userValue < value;
        case '<=': return userValue <= value;
        default: return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Erreur évaluation:', error);
    return false;
  }
}

testConnection(); 