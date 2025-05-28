export interface PersonalInfo {
  firstName: string;
  lastName: string;
  profilePicture: string;
  gender: string;
  dateOfBirth: Date | null;
}

export interface CivilStatus {
  maritalStatus: string | null;
  customMaritalStatus?: string;
  numberOfChildren: number;
  spouseName: string;
  nationalities: string[];
  customNationalities?: string[];
  countryOfOrigin: string | null;
  customCountryOfOrigin?: string;
}

export interface IdentityDocuments {
  cnsNumber: string;
  passportNumber: string;
  nationalRegisterNumber: string;
  hasResidencePermit: boolean;
}

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
  residenceStatus: string;
}

export interface Contact {
  primaryPhone: string;
  secondaryPhone: string;
  primaryEmail: string;
  secondaryEmail: string;
  preferredContact: string;
}

export interface Employment {
  status: string;
  customStatus?: string;
  employerName: string;
  industrySector: string;
  customSector?: string;
  monthlyIncome: string;
  householdIncome?: string;
  socialAssistance: boolean;
  assistanceTypes: string[];
  customAssistanceTypes?: string;
  recentApplication: boolean;
  ongoingCase: boolean;
  caseDetails: string;
}

export interface Languages {
  primary: string;
  customPrimary?: string;
  secondary: string[];
  customSecondary?: string[];
  preferred: string;
  customPreferred?: string;
  needsAssistance: boolean;
  assistanceDetails: string;
  simplifiedMode: boolean;
}

export interface Health {
  hasHealthIssues: boolean;
  healthIssueType: string;
  allergies: string;
  hasDisability: boolean;
  disabilityDetails: string;
  needsMedicalAssistance: boolean;
  medicalAssistanceDetails?: string;
}

export interface UserProfile {
  personalInfo: PersonalInfo;
  civilStatus: CivilStatus;
  identityDocuments: IdentityDocuments;
  address: Address;
  contact: Contact;
  employment: Employment;
  languages: Languages;
  health: Health;
}