import React from 'react';
import { Employment } from '../../../types/user';
import Select from 'react-select';

interface EmploymentStatusProps {
  data: Employment;
  onChange: (data: Employment) => void;
}

const EmploymentStatus: React.FC<EmploymentStatusProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Employment, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const employmentStatusOptions = [
    { value: 'employed', label: '👔 Employé' },
    { value: 'self-employed', label: '💼 Indépendant' },
    { value: 'unemployed', label: '🔍 Sans emploi' },
    { value: 'student', label: '🎓 Étudiant' },
    { value: 'retired', label: '🌴 Retraité' },
    { value: 'revis', label: '📋 Bénéficiaire REVIS' },
    { value: 'tuc', label: '🤝 Travail d\'utilité collectif' },
    { value: 'adem', label: '📊 Inscrit à l\'ADEM' }
  ];

  const industrySectorOptions = [
    { value: 'finance', label: '💰 Finance' },
    { value: 'it', label: '💻 IT & Digital' },
    { value: 'healthcare', label: '🏥 Santé' },
    { value: 'education', label: '📚 Éducation' },
    { value: 'construction', label: '🏗️ Construction' },
    { value: 'retail', label: '🛍️ Commerce' },
    { value: 'hospitality', label: '🏨 Hôtellerie & Restauration' },
    { value: 'transport', label: '🚛 Transport & Logistique' },
    { value: 'public', label: '🏛️ Secteur public' }
  ];

  const assistanceTypeOptions = [
    { value: 'revis', label: '📋 REVIS' },
    { value: 'cost-of-living', label: '💶 Allocation de vie chère' },
    { value: 'housing', label: '🏠 Aide au logement' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Allocation familiale' },
    { value: 'disability', label: '♿ Prestations handicap' },
    { value: 'unemployment', label: '🔍 Indemnités de chômage' },
    { value: 'energy', label: '⚡ Prime énergie' },
    { value: 'mobility', label: '🚌 Subvention mobilité' }
  ];

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    if (number === '') return '';
    return new Intl.NumberFormat('fr-LU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(number));
  };

  const assistanceTypes = data.assistanceTypes || [];
  
  const selectedAssistanceTypes = assistanceTypeOptions.filter(option => 
    assistanceTypes.includes(option.value)
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut professionnel
        </label>
        <Select
          value={employmentStatusOptions.find(option => option.value === data.status)}
          onChange={(option) => handleChange('status', option?.value || '')}
          options={employmentStatusOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre statut professionnel"
          isSearchable
          isClearable
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 })
          }}
        />
      </div>

      {['employed', 'self-employed'].includes(data.status || '') && (
        <>
          <div>
            <label htmlFor="employerName" className="block text-sm font-medium text-gray-700 mb-2">
              {data.status === 'self-employed' ? 'Nom de votre entreprise' : 'Nom de l\'employeur'}
            </label>
            <input
              type="text"
              id="employerName"
              value={data.employerName}
              onChange={(e) => handleChange('employerName', e.target.value)}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder={data.status === 'self-employed' ? 'Nom de votre entreprise' : 'Nom de l\'employeur'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secteur d'activité
            </label>
            <Select
              value={industrySectorOptions.find(option => option.value === data.industrySector)}
              onChange={(option) => handleChange('industrySector', option?.value || '')}
              options={industrySectorOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Sélectionner votre secteur d'activité"
              isSearchable
              isClearable
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
            Revenu mensuel
          </label>
          <div className="relative">
            <input
              type="text"
              id="monthlyIncome"
              value={data.monthlyIncome}
              onChange={(e) => handleChange('monthlyIncome', formatCurrency(e.target.value))}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="€"
            />
          </div>
        </div>

        <div>
          <label htmlFor="householdIncome" className="block text-sm font-medium text-gray-700 mb-2">
            Revenu du ménage (optionnel)
          </label>
          <div className="relative">
            <input
              type="text"
              id="householdIncome"
              value={data.householdIncome || ''}
              onChange={(e) => handleChange('householdIncome', formatCurrency(e.target.value))}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="€"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="socialAssistance"
            checked={data.socialAssistance}
            onChange={(e) => {
              const checked = e.target.checked;
              handleChange('socialAssistance', checked);
              if (!checked) {
                handleChange('assistanceTypes', []);
              }
            }}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="socialAssistance" className="ml-2 block text-sm text-gray-700">
            Je reçois une aide sociale
          </label>
        </div>

        {data.socialAssistance && (
          <div className="mt-4 space-y-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types d'aide reçue
              </label>
              <Select
                isMulti
                value={selectedAssistanceTypes}
                onChange={(selectedOptions) => {
                  const values = selectedOptions.map(option => option.value);
                  handleChange('assistanceTypes', values);
                }}
                options={assistanceTypeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Sélectionner les types d'aide"
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
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="recentApplication"
            checked={data.recentApplication}
            onChange={(e) => handleChange('recentApplication', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="recentApplication" className="ml-2 block text-sm text-gray-700">
            J'ai récemment fait une demande d'aide
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ongoingCase"
            checked={data.ongoingCase}
            onChange={(e) => {
              const checked = e.target.checked;
              handleChange('ongoingCase', checked);
              if (!checked) {
                handleChange('caseDetails', '');
              }
            }}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="ongoingCase" className="ml-2 block text-sm text-gray-700">
            J'ai un dossier en cours
          </label>
        </div>

        {data.ongoingCase && (
          <div className="animate-fadeIn">
            <label htmlFor="caseDetails" className="block text-sm font-medium text-gray-700 mb-2">
              Détails du dossier
            </label>
            <textarea
              id="caseDetails"
              value={data.caseDetails}
              onChange={(e) => handleChange('caseDetails', e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Décrivez brièvement votre dossier en cours"
            />
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 Ces informations nous aident à identifier les aides auxquelles vous pourriez avoir droit. Toutes les données restent confidentielles.
        </p>
      </div>
    </div>
  );
};

export default EmploymentStatus;