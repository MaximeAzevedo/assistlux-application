import { useState } from 'react';
import { CivilStatus as CivilStatusType } from '../../../types/user';
import Select from 'react-select';

interface CivilStatusProps {
  data: CivilStatusType;
  onChange: (data: CivilStatusType) => void;
}

const CivilStatus: React.FC<CivilStatusProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof CivilStatusType, value: any) => {
    console.log(`Updating ${field}:`, value);
    onChange({
      ...data,
      [field]: value
    });
  };

  const maritalStatusOptions = [
    { value: 'single', label: '👤 Célibataire' },
    { value: 'married', label: '💑 Marié(e)' },
    { value: 'pacs', label: '🤝 Pacsé(e)' },
    { value: 'divorced', label: '📄 Divorcé(e)' },
    { value: 'separated', label: '↔️ Séparé(e)' },
    { value: 'widowed', label: '💔 Veuf/Veuve' }
  ];

  const childrenOptions = Array.from({ length: 11 }, (_, i) => ({
    value: i,
    label: i === 10 ? '10+ enfants' : `${i} enfant${i !== 1 ? 's' : ''}`
  }));

  const countryOptions = [
    // Europe
    { value: 'lu', label: '🇱🇺 Luxembourg', group: 'Europe' },
    { value: 'fr', label: '🇫🇷 France', group: 'Europe' },
    { value: 'de', label: '🇩🇪 Allemagne', group: 'Europe' },
    { value: 'be', label: '🇧🇪 Belgique', group: 'Europe' },
    { value: 'nl', label: '🇳🇱 Pays-Bas', group: 'Europe' },
    { value: 'it', label: '🇮🇹 Italie', group: 'Europe' },
    { value: 'pt', label: '🇵🇹 Portugal', group: 'Europe' },
    { value: 'es', label: '🇪🇸 Espagne', group: 'Europe' },
    { value: 'gb', label: '🇬🇧 Royaume-Uni', group: 'Europe' },
    { value: 'ie', label: '🇮🇪 Irlande', group: 'Europe' },
    { value: 'ch', label: '🇨🇭 Suisse', group: 'Europe' },
    { value: 'at', label: '🇦🇹 Autriche', group: 'Europe' },
    { value: 'pl', label: '🇵🇱 Pologne', group: 'Europe' },
    { value: 'ro', label: '🇷🇴 Roumanie', group: 'Europe' },
    { value: 'bg', label: '🇧🇬 Bulgarie', group: 'Europe' },
    { value: 'gr', label: '🇬🇷 Grèce', group: 'Europe' },
    
    // Afrique
    { value: 'ma', label: '🇲🇦 Maroc', group: 'Afrique' },
    { value: 'dz', label: '🇩🇿 Algérie', group: 'Afrique' },
    { value: 'tn', label: '🇹🇳 Tunisie', group: 'Afrique' },
    { value: 'sn', label: '🇸🇳 Sénégal', group: 'Afrique' },
    { value: 'ci', label: '🇨🇮 Côte d\'Ivoire', group: 'Afrique' },
    { value: 'cm', label: '🇨🇲 Cameroun', group: 'Afrique' },
    { value: 'cd', label: '🇨🇩 RD Congo', group: 'Afrique' },
    
    // Asie
    { value: 'cn', label: '🇨🇳 Chine', group: 'Asie' },
    { value: 'jp', label: '🇯🇵 Japon', group: 'Asie' },
    { value: 'kr', label: '🇰🇷 Corée du Sud', group: 'Asie' },
    { value: 'in', label: '🇮🇳 Inde', group: 'Asie' },
    { value: 'vn', label: '🇻🇳 Vietnam', group: 'Asie' },
    { value: 'th', label: '🇹🇭 Thaïlande', group: 'Asie' },
    
    // Moyen-Orient
    { value: 'sy', label: '🇸🇾 Syrie', group: 'Moyen-Orient' },
    { value: 'iq', label: '🇮🇶 Irak', group: 'Moyen-Orient' },
    { value: 'ir', label: '🇮🇷 Iran', group: 'Moyen-Orient' },
    { value: 'af', label: '🇦🇫 Afghanistan', group: 'Moyen-Orient' },
    
    // Amériques
    { value: 'us', label: '🇺🇸 États-Unis', group: 'Amériques' },
    { value: 'ca', label: '🇨🇦 Canada', group: 'Amériques' },
    { value: 'br', label: '🇧🇷 Brésil', group: 'Amériques' },
    { value: 'mx', label: '🇲🇽 Mexique', group: 'Amériques' }
  ];

  const residenceStatusOptions = [
    { value: 'citizen', label: '🇱🇺 Citoyen luxembourgeois' },
    { value: 'eu_citizen', label: '🇪🇺 Citoyen européen' },
    { value: 'permanent', label: '📝 Résident permanent' },
    { value: 'temporary', label: '⏳ Résident temporaire' },
    { value: 'work_permit', label: '💼 Permis de travail' },
    { value: 'student', label: '🎓 Étudiant' },
    { value: 'asylum', label: '🏛️ Demandeur d\'asile' },
    { value: 'protection', label: '🛡️ Bénéficiaire de protection internationale' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Regroupement familial' }
  ];

  const groupedOptions = [
    {
      label: 'Europe',
      options: countryOptions.filter(country => country.group === 'Europe'),
    },
    {
      label: 'Afrique',
      options: countryOptions.filter(country => country.group === 'Afrique'),
    },
    {
      label: 'Asie',
      options: countryOptions.filter(country => country.group === 'Asie'),
    },
    {
      label: 'Moyen-Orient',
      options: countryOptions.filter(country => country.group === 'Moyen-Orient'),
    },
    {
      label: 'Amériques',
      options: countryOptions.filter(country => country.group === 'Amériques'),
    }
  ];

  const selectStyles = {
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    }),
    control: (base: any) => ({
      ...base,
      minHeight: '42px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#EDE9FE',
      borderRadius: '6px',
      padding: '2px',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#5B21B6',
      fontSize: '0.875rem',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#5B21B6',
      ':hover': {
        backgroundColor: '#DDD6FE',
        color: '#4C1D95',
      },
    }),
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          État civil
        </label>
        <Select
          value={maritalStatusOptions.find(option => option.value === data.maritalStatus)}
          onChange={(option) => handleChange('maritalStatus', option?.value || null)}
          options={maritalStatusOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre état civil"
          isSearchable={false}
          isClearable
          menuPortalTarget={document.body}
          styles={selectStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre d'enfants
        </label>
        <Select
          value={childrenOptions.find(option => option.value === data.numberOfChildren)}
          onChange={(option) => handleChange('numberOfChildren', option?.value ?? 0)}
          options={childrenOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner le nombre d'enfants"
          isSearchable={false}
          isClearable
          menuPortalTarget={document.body}
          styles={selectStyles}
        />
      </div>

      {(data.maritalStatus === 'married' || data.maritalStatus === 'pacs') && (
        <div className="animate-fadeIn">
          <label htmlFor="spouseName" className="block text-sm font-medium text-gray-700 mb-2">
            Nom du conjoint
          </label>
          <input
            type="text"
            id="spouseName"
            value={data.spouseName}
            onChange={(e) => handleChange('spouseName', e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="Nom et prénom du conjoint"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nationalité
        </label>
        <Select
          value={countryOptions.find(option => option.value === data.countryOfOrigin)}
          onChange={(option) => handleChange('countryOfOrigin', option?.value || null)}
          options={groupedOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre nationalité"
          isSearchable
          isClearable
          menuPortalTarget={document.body}
          styles={selectStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut de résidence
        </label>
        <Select
          value={residenceStatusOptions.find(status => status.value === data.residenceStatus)}
          onChange={(option) => handleChange('residenceStatus', option?.value || '')}
          options={residenceStatusOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre statut de résidence"
          isSearchable
          isClearable
          menuPortalTarget={document.body}
          styles={selectStyles}
        />
      </div>
    </div>
  );
};

export default CivilStatus;