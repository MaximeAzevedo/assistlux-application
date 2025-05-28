import React, { useRef } from 'react';
import { PersonalInfo as PersonalInfoType } from '../../../types/user';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Camera } from 'lucide-react';

interface PersonalInfoProps {
  data: PersonalInfoType;
  onChange: (data: PersonalInfoType) => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof PersonalInfoType, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 10MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('profilePicture', reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Une erreur est survenue lors du traitement de l\'image');
    }
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // Convert string date to Date object if needed
  const getValidDate = (date: Date | null | string): Date | null => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime()) ? dateObj : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Photo de profil
        </label>
        <div className="flex items-center gap-6">
          <div className="relative group">
            {data.profilePicture ? (
              <img
                src={data.profilePicture}
                alt="Photo de profil"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <span className="text-gray-400 text-4xl">👤</span>
              </div>
            )}
            <button
              onClick={triggerPhotoUpload}
              type="button"
              className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50"
            >
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={triggerPhotoUpload}
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Changer la photo
            </button>
            {data.profilePicture && (
              <button
                onClick={() => handleChange('profilePicture', '')}
                type="button"
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          JPG, PNG jusqu'à 10MB
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            Prénom
          </label>
          <input
            type="text"
            id="firstName"
            value={data.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="Votre prénom"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Nom
          </label>
          <input
            type="text"
            id="lastName"
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="Votre nom"
          />
        </div>
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
          Genre
        </label>
        <select
          id="gender"
          value={data.gender}
          onChange={(e) => handleChange('gender', e.target.value)}
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
        >
          <option value="">Sélectionner</option>
          <option value="male">Homme</option>
          <option value="female">Femme</option>
          <option value="other">Autre</option>
          <option value="prefer_not_to_say">Je préfère ne pas préciser</option>
        </select>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
          Date de naissance
        </label>
        <DatePicker
          selected={getValidDate(data.dateOfBirth)}
          onChange={(date) => handleChange('dateOfBirth', date)}
          dateFormat="dd/MM/yyyy"
          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 transition-colors"
          placeholderText="Sélectionner une date"
          showYearDropdown
          dropdownMode="select"
          maxDate={new Date()}
          yearDropdownItemNumber={100}
          scrollableYearDropdown
          isClearable
        />
      </div>
    </div>
  );
};

export default PersonalInfo;