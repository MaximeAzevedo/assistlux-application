import { useState } from 'react';
import { Languages } from '../../../types/user';
import Select from 'react-select';

interface LanguagesAccessibilityProps {
  data: Languages;
  onChange: (data: Languages) => void;
}

const LanguagesAccessibility: React.FC<LanguagesAccessibilityProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Languages, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const languageOptions = [
    // Europe
    { value: 'lb', label: '🇱🇺 Luxembourgeois', group: 'Europe' },
    { value: 'fr', label: '🇫🇷 Français', group: 'Europe' },
    { value: 'de', label: '🇩🇪 Allemand', group: 'Europe' },
    { value: 'en', label: '🇬🇧 Anglais', group: 'Europe' },
    { value: 'pt', label: '🇵🇹 Portugais', group: 'Europe' },
    { value: 'it', label: '🇮🇹 Italien', group: 'Europe' },
    { value: 'es', label: '🇪🇸 Espagnol', group: 'Europe' },
    { value: 'nl', label: '🇳🇱 Néerlandais', group: 'Europe' },
    { value: 'pl', label: '🇵🇱 Polonais', group: 'Europe' },
    { value: 'ro', label: '🇷🇴 Roumain', group: 'Europe' },
    { value: 'bg', label: '🇧🇬 Bulgare', group: 'Europe' },
    { value: 'hr', label: '🇭🇷 Croate', group: 'Europe' },
    { value: 'el', label: '🇬🇷 Grec', group: 'Europe' },
    { value: 'hu', label: '🇭🇺 Hongrois', group: 'Europe' },
    { value: 'ru', label: '🇷🇺 Russe', group: 'Europe' },
    { value: 'uk', label: '🇺🇦 Ukrainien', group: 'Europe' },
    
    // Afrique
    { value: 'ar', label: '🇲🇦 Arabe', group: 'Afrique' },
    { value: 'sw', label: '🇰🇪 Swahili', group: 'Afrique' },
    { value: 'am', label: '🇪🇹 Amharique', group: 'Afrique' },
    { value: 'wo', label: '🇸🇳 Wolof', group: 'Afrique' },
    { value: 'rw', label: '🇷🇼 Kinyarwanda', group: 'Afrique' },
    
    // Asie
    { value: 'zh', label: '🇨🇳 Chinois', group: 'Asie' },
    { value: 'ja', label: '🇯🇵 Japonais', group: 'Asie' },
    { value: 'ko', label: '🇰🇷 Coréen', group: 'Asie' },
    { value: 'vi', label: '🇻🇳 Vietnamien', group: 'Asie' },
    { value: 'hi', label: '🇮🇳 Hindi', group: 'Asie' },
    { value: 'ur', label: '🇵🇰 Ourdou', group: 'Asie' },
    { value: 'fa', label: '🇮🇷 Persan', group: 'Asie' },
    { value: 'tl', label: '🇵🇭 Tagalog', group: 'Asie' }
  ];

  const groupedOptions = [
    {
      label: 'Europe',
      options: languageOptions.filter(lang => lang.group === 'Europe'),
    },
    {
      label: 'Afrique',
      options: languageOptions.filter(lang => lang.group === 'Afrique'),
    },
    {
      label: 'Asie',
      options: languageOptions.filter(lang => lang.group === 'Asie'),
    }
  ];

  // Initialize arrays if undefined
  const secondary = data.secondary || [];

  // Map the selected values to their corresponding options
  const selectedSecondaryLanguages = languageOptions.filter(option => 
    secondary.includes(option.value)
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Langue principale
        </label>
        <Select
          value={languageOptions.find(option => option.value === data.primary) || null}
          onChange={(option) => handleChange('primary', option?.value || '')}
          options={groupedOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre langue principale"
          isSearchable
          isClearable
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base) => ({
              ...base,
              minHeight: '42px',
            })
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Langues secondaires
        </label>
        <Select
          isMulti
          value={selectedSecondaryLanguages}
          onChange={(selectedOptions) => {
            const values = selectedOptions.map(option => option.value);
            handleChange('secondary', values);
          }}
          options={groupedOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner vos langues secondaires"
          isSearchable
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base) => ({
              ...base,
              minHeight: '42px',
            }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: '#EDE9FE',
              borderRadius: '6px',
              padding: '2px',
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: '#5B21B6',
              fontSize: '0.875rem',
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: '#5B21B6',
              ':hover': {
                backgroundColor: '#DDD6FE',
                color: '#4C1D95',
              },
            }),
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Langue de communication préférée
        </label>
        <Select
          value={languageOptions.find(option => option.value === data.preferred) || null}
          onChange={(option) => handleChange('preferred', option?.value || '')}
          options={groupedOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre langue préférée"
          isSearchable
          isClearable
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base) => ({
              ...base,
              minHeight: '42px',
            })
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Autre langue (optionnel)
        </label>
        <input
          type="text"
          value={data.customSecondary?.join(', ') || ''}
          onChange={(e) => handleChange('customSecondary', e.target.value.split(',').map(s => s.trim()))}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholder="Saisissez d'autres langues (séparées par des virgules)"
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="needsAssistance"
            checked={data.needsAssistance}
            onChange={(e) => {
              const checked = e.target.checked;
              handleChange('needsAssistance', checked);
              if (!checked) {
                handleChange('assistanceDetails', '');
              }
            }}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="needsAssistance" className="ml-2 block text-sm text-gray-700">
            J'ai besoin d'assistance linguistique
          </label>
        </div>

        {data.needsAssistance && (
          <div className="animate-fadeIn ml-6">
            <label htmlFor="assistanceDetails" className="block text-sm font-medium text-gray-700 mb-2">
              Précisez vos besoins d'assistance
            </label>
            <textarea
              id="assistanceDetails"
              value={data.assistanceDetails}
              onChange={(e) => handleChange('assistanceDetails', e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Ex: besoin d'un interprète, difficulté avec certains documents administratifs..."
            />
          </div>
        )}

        <div className="flex items-center pt-4">
          <input
            type="checkbox"
            id="simplifiedMode"
            checked={data.simplifiedMode}
            onChange={(e) => handleChange('simplifiedMode', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors"
          />
          <label htmlFor="simplifiedMode" className="ml-2 block text-sm text-gray-700">
            Activer le mode simplifié (textes plus clairs et plus faciles à comprendre)
          </label>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-700">
          💡 Votre choix de langue nous aide à mieux adapter nos services et communications à vos besoins.
        </p>
      </div>
    </div>
  );
};

export default LanguagesAccessibility;