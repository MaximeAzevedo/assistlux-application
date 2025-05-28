import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PersonalInfo from './sections/PersonalInfo';
import CivilStatus from './sections/CivilStatus';
import IdentityDocuments from './sections/IdentityDocuments';
import AddressLocation from './sections/AddressLocation';
import ContactInfo from './sections/ContactInfo';
import EmploymentStatus from './sections/EmploymentStatus';
import LanguagesAccessibility from './sections/LanguagesAccessibility';
import HealthNeeds from './sections/HealthNeeds';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ProfilePDF from './ProfilePDF';
import { Save, Download, AlertCircle, User } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const PersonalSpace: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('personalInfo');
  const [profile, setProfile] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      profilePicture: '',
      gender: '',
      dateOfBirth: null,
    },
    civilStatus: {
      maritalStatus: null,
      customMaritalStatus: '',
      numberOfChildren: 0,
      spouseName: '',
      nationalities: [],
      customNationalities: [],
      countryOfOrigin: null,
      customCountryOfOrigin: '',
    },
    identityDocuments: {
      cnsNumber: '',
      passportNumber: '',
      nationalRegisterNumber: '',
      hasResidencePermit: false,
    },
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: 'Luxembourg',
      residenceStatus: '',
    },
    contact: {
      primaryPhone: '',
      secondaryPhone: '',
      primaryEmail: currentUser?.email || '',
      secondaryEmail: '',
      preferredContact: '',
    },
    employment: {
      status: '',
      employerName: '',
      industrySector: '',
      monthlyIncome: '',
      socialAssistance: false,
      assistanceTypes: [],
      recentApplication: false,
      ongoingCase: false,
      caseDetails: '',
    },
    languages: {
      primary: '',
      secondary: [],
      preferred: '',
      needsAssistance: false,
      assistanceDetails: '',
      simplifiedMode: false,
    },
    health: {
      hasHealthIssues: false,
      healthIssueType: '',
      allergies: '',
      hasDisability: false,
      disabilityDetails: '',
      needsMedicalAssistance: false,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<string | null>(null);

  const serializeProfile = (data: any): any => {
    if (!data) return null;
    
    if (data instanceof Date) {
      return data.toISOString();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => serializeProfile(item));
    }
    
    if (typeof data === 'object') {
      const serialized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          const serializedValue = serializeProfile(value);
          if (serializedValue !== undefined) {
            serialized[key] = serializedValue;
          }
        }
      }
      return serialized;
    }
    
    return data;
  };

  const deserializeProfile = (data: any): any => {
    if (!data) return null;

    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      const date = new Date(data);
      return !isNaN(date.getTime()) ? date : null;
    }

    if (Array.isArray(data)) {
      return data.map(item => deserializeProfile(item));
    }

    if (typeof data === 'object') {
      const deserialized: any = {};
      for (const [key, value] of Object.entries(data)) {
        deserialized[key] = deserializeProfile(value);
      }
      return deserialized;
    }

    return data;
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        const userProfileRef = doc(db, 'users', currentUser.uid);
        const profileDoc = await getDoc(userProfileRef);
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          console.log('Raw Firestore data:', data);
          
          setLastSavedData(JSON.stringify(data));
          
          const deserializedData = deserializeProfile(data);
          console.log('Deserialized profile data:', deserializedData);
          
          setProfile(prevProfile => ({
            ...prevProfile,
            ...deserializedData
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setSaveError('Une erreur est survenue lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) {
      setSaveError('Vous devez être connecté pour enregistrer votre profil');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const serializedProfile = serializeProfile(profile);
      console.log('Serialized profile for saving:', serializedProfile);
      
      const currentData = JSON.stringify(serializedProfile);
      if (currentData === lastSavedData) {
        console.log('No changes detected, skipping save');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return;
      }
      
      const userProfileRef = doc(db, 'users', currentUser.uid);
      await setDoc(userProfileRef, {
        ...serializedProfile,
        updatedAt: new Date().toISOString(),
      });

      setLastSavedData(currentData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Une erreur est survenue lors de l\'enregistrement du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'personalInfo', title: 'Informations Personnelles', component: PersonalInfo },
    { id: 'civilStatus', title: 'État Civil', component: CivilStatus },
    { id: 'identityDocuments', title: 'Documents d\'Identité', component: IdentityDocuments },
    { id: 'address', title: 'Adresse & Localisation', component: AddressLocation },
    { id: 'contact', title: 'Coordonnées', component: ContactInfo },
    { id: 'employment', title: 'Emploi & Situation Financière', component: EmploymentStatus },
    { id: 'languages', title: 'Langues & Accessibilité', component: LanguagesAccessibility },
    { id: 'health', title: 'Santé & Besoins Spéciaux', component: HealthNeeds },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex items-center gap-8">
            <div className="relative group">
              {profile.personalInfo.profilePicture ? (
                <img
                  src={profile.personalInfo.profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-md">
                  <User className="w-12 h-12 text-white/70" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profile.personalInfo.firstName
                  ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`
                  : 'Mon Profil'}
              </h1>
              <p className="text-white/80">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            
            <PDFDownloadLink
              document={<ProfilePDF profile={profile} />}
              fileName="mon-profil.pdf"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Download className="w-5 h-5" />
              Télécharger en PDF
            </PDFDownloadLink>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mb-6 animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg mb-6 animate-fadeIn">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Profil enregistré avec succès</span>
            </div>
          )}

          <div className="space-y-4">
            {sections.map(({ id, title, component: Section }) => (
              <div key={id} className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-purple-200">
                <button
                  onClick={() => setActiveSection(id)}
                  className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{title}</span>
                  <div className={`transform transition-transform duration-200 ${
                    activeSection === id ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${
                  activeSection === id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="p-6 bg-white border-t border-gray-100">
                    <Section
                      data={profile[id]}
                      onChange={(newData) =>
                        setProfile((prev) => ({ ...prev, [id]: newData }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSpace;