import React from 'react';
import { Health } from '../../../types/user';
import Select from 'react-select';

interface HealthNeedsProps {
  data: Health;
  onChange: (data: Health) => void;
}

const HealthNeeds: React.FC<HealthNeedsProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Health, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const healthIssueTypeOptions = [
    { value: 'chronic', label: '🫀 Maladie chronique', group: 'Conditions médicales' },
    { value: 'cardiovascular', label: '💗 Problèmes cardiovasculaires', group: 'Conditions médicales' },
    { value: 'respiratory', label: '🫁 Problèmes respiratoires', group: 'Conditions médicales' },
    { value: 'diabetes', label: '💉 Diabète', group: 'Conditions médicales' },
    { value: 'neurological', label: '🧠 Troubles neurologiques', group: 'Conditions médicales' },
    { value: 'musculoskeletal', label: '🦴 Problèmes musculo-squelettiques', group: 'Conditions médicales' },
    { value: 'digestive', label: '🫁 Troubles digestifs', group: 'Conditions médicales' },
    { value: 'mental_health', label: '🧘 Santé mentale', group: 'Conditions médicales' },
    
    { value: 'visual', label: '👁️ Déficience visuelle', group: 'Handicaps' },
    { value: 'hearing', label: '👂 Déficience auditive', group: 'Handicaps' },
    { value: 'mobility', label: '🦽 Mobilité réduite', group: 'Handicaps' },
    { value: 'cognitive', label: '🧩 Troubles cognitifs', group: 'Handicaps' },
    { value: 'speech', label: '🗣️ Troubles de la parole', group: 'Handicaps' },
    
    { value: 'food', label: '🥗 Allergies alimentaires', group: 'Allergies' },
    { value: 'medication', label: '💊 Allergies médicamenteuses', group: 'Allergies' },
    { value: 'environmental', label: '🌿 Allergies environnementales', group: 'Allergies' },
    { value: 'latex', label: '🧤 Allergie au latex', group: 'Allergies' },
    
    { value: 'other', label: '✏️ Autre condition...', group: 'Autre' }
  ];

  const groupedOptions = [
    {
      label: 'Conditions médicales',
      options: healthIssueTypeOptions.filter(option => option.group === 'Conditions médicales'),
    },
    {
      label: 'Handicaps',
      options: healthIssueTypeOptions.filter(option => option.group === 'Handicaps'),
    },
    {
      label: 'Allergies',
      options: healthIssueTypeOptions.filter(option => option.group === 'Allergies'),
    },
    {
      label: 'Autre',
      options: healthIssueTypeOptions.filter(option => option.group === 'Autre'),
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="hasHealthIssues"
            checked={data.hasHealthIssues}
            onChange={(e) => handleChange('hasHealthIssues', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="hasHealthIssues" className="ml-2 block text-sm text-gray-700">
            J'ai des problèmes de santé particuliers
          </label>
        </div>

        {data.hasHealthIssues && (
          <div className="space-y-4 animate-fadeIn ml-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de problème de santé
              </label>
              <Select
                value={healthIssueTypeOptions.find(option => option.value === data.healthIssueType)}
                onChange={(option) => handleChange('healthIssueType', option?.value)}
                options={groupedOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Sélectionner votre condition"
                isSearchable
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>

            {data.healthIssueType === 'other' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Précisez votre condition
                </label>
                <textarea
                  value={data.allergies} // Réutilisation du champ allergies pour la condition personnalisée
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  rows={2}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Décrivez votre condition médicale"
                />
              </div>
            )}

            {data.healthIssueType?.includes('allerg') && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Précisez vos allergies
                </label>
                <textarea
                  value={data.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  rows={2}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Listez vos allergies et leur gravité"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="hasDisability"
            checked={data.hasDisability}
            onChange={(e) => handleChange('hasDisability', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="hasDisability" className="ml-2 block text-sm text-gray-700">
            J'ai un handicap ou des besoins spéciaux
          </label>
        </div>

        {data.hasDisability && (
          <div className="animate-fadeIn ml-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description du handicap ou des besoins spéciaux
            </label>
            <textarea
              value={data.disabilityDetails}
              onChange={(e) => handleChange('disabilityDetails', e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Décrivez votre handicap et les aménagements nécessaires"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="needsMedicalAssistance"
            checked={data.needsMedicalAssistance}
            onChange={(e) => handleChange('needsMedicalAssistance', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="needsMedicalAssistance" className="ml-2 block text-sm text-gray-700">
            J'ai besoin d'assistance médicale
          </label>
        </div>

        {data.needsMedicalAssistance && (
          <div className="animate-fadeIn ml-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Précisez vos besoins d'assistance médicale
            </label>
            <textarea
              value={data.medicalAssistanceDetails || ''}
              onChange={(e) => handleChange('medicalAssistanceDetails', e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Ex: soins réguliers, équipement médical, médicaments spécifiques..."
            />
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-700">
          💡 Ces informations nous aident à mieux adapter nos services à vos besoins et à assurer votre sécurité. Elles restent strictement confidentielles.
        </p>
      </div>
    </div>
  );
};

export default HealthNeeds;