import { useState, useEffect } from 'react';
import { Address } from '../../../types/user';

interface AddressLocationProps {
  data: Address;
  onChange: (data: Address) => void;
}

const AddressLocation: React.FC<AddressLocationProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Address, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
          Rue et numéro
        </label>
        <input
          type="text"
          id="street"
          value={data.street}
          onChange={(e) => handleChange('street', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholder="123 Rue de la Gare"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
            Code postal
          </label>
          <input
            type="text"
            id="postalCode"
            value={data.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="L-1234"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Ville
          </label>
          <input
            type="text"
            id="city"
            value={data.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="Saisissez votre ville"
          />
        </div>
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
          Pays
        </label>
        <input
          type="text"
          id="country"
          value={data.country}
          onChange={(e) => handleChange('country', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholder="Saisissez votre pays"
        />
      </div>
    </div>
  );
};

export default AddressLocation;