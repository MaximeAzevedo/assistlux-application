import { useState } from 'react';
import { Contact } from '../../../types/user';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Select from 'react-select';

interface ContactInfoProps {
  data: Contact;
  onChange: (data: Contact) => void;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Contact, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const preferredContactOptions = [
    { value: 'email', label: '📧 Email' },
    { value: 'phone', label: '📱 Téléphone' },
    { value: 'sms', label: '💬 SMS' },
    { value: 'whatsapp', label: '📲 WhatsApp' },
    { value: 'letter', label: '✉️ Courrier postal' },
    { value: 'visit', label: '🏢 Visite en personne' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone principal
        </label>
        <PhoneInput
          international
          defaultCountry="LU"
          value={data.primaryPhone}
          onChange={(value) => handleChange('primaryPhone', value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone secondaire (optionnel)
        </label>
        <PhoneInput
          international
          defaultCountry="LU"
          value={data.secondaryPhone}
          onChange={(value) => handleChange('secondaryPhone', value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="primaryEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Email principal
        </label>
        <input
          type="email"
          id="primaryEmail"
          value={data.primaryEmail}
          onChange={(e) => handleChange('primaryEmail', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholder="vous@exemple.com"
        />
      </div>

      <div>
        <label htmlFor="secondaryEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Email secondaire (optionnel)
        </label>
        <input
          type="email"
          id="secondaryEmail"
          value={data.secondaryEmail}
          onChange={(e) => handleChange('secondaryEmail', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholder="autre@exemple.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Méthode de contact préférée
        </label>
        <Select
          value={preferredContactOptions.find(option => option.value === data.preferredContact)}
          onChange={(option) => handleChange('preferredContact', option?.value)}
          options={preferredContactOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Sélectionner votre méthode de contact préférée"
          isSearchable={false}
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 })
          }}
        />
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-700">
          💡 Nous utiliserons votre méthode de contact préférée pour toutes les communications importantes concernant vos dossiers et demandes.
        </p>
      </div>
    </div>
  );
};

export default ContactInfo;