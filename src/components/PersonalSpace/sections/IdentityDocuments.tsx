import { useState } from 'react';
import { IdentityDocuments as IdentityDocumentsType } from '../../../types/user';

interface IdentityDocumentsProps {
  data: IdentityDocumentsType;
  onChange: (data: IdentityDocumentsType) => void;
}

const IdentityDocuments: React.FC<IdentityDocumentsProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof IdentityDocumentsType, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="cnsNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Numéro CNS
        </label>
        <input
          type="text"
          id="cnsNumber"
          value={data.cnsNumber}
          onChange={(e) => handleChange('cnsNumber', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div>
        <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Numéro de passeport
        </label>
        <input
          type="text"
          id="passportNumber"
          value={data.passportNumber}
          onChange={(e) => handleChange('passportNumber', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div>
        <label htmlFor="nationalRegisterNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Numéro de registre national
        </label>
        <input
          type="text"
          id="nationalRegisterNumber"
          value={data.nationalRegisterNumber}
          onChange={(e) => handleChange('nationalRegisterNumber', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="hasResidencePermit"
            checked={data.hasResidencePermit}
            onChange={(e) => handleChange('hasResidencePermit', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="hasResidencePermit" className="ml-2 block text-sm text-gray-700">
            Permis de résidence
          </label>
        </div>
      </div>
    </div>
  );
};

export default IdentityDocuments;