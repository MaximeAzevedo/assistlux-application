export interface Question {
  id: string;
  order: number;
  type: 'numeric' | 'boolean' | 'single_select';
  question_fr: string;
  question_en: string;
  question_de: string;
  hint_fr?: string;
  hint_en?: string;
  hint_de?: string;
  options?: string[];
  field: string;
}

export interface Aid {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  description_fr: string;
  description_en: string;
  description_de: string;
  link: string;
}

export interface Rule {
  id: string;
  aid_id: string;
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
}

export interface Threshold {
  id: string;
  aid_id: string;
  household_size: number;
  max_income: number;
}

export interface Message {
  id: string;
  key: string;
  text_fr: string;
  text_en: string;
  text_de: string;
}

export interface UserAnswers {
  [key: string]: string | number | boolean;
}