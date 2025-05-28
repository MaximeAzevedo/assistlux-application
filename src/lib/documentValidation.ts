import { z } from 'zod';

// Field validation schemas
const addressSchema = z.object({
  street: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postalCode: z.string().regex(/^[LB]-\d{4}$/, "Code postal invalide"),
  country: z.string().min(1, "Le pays est requis")
});

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  dateOfBirth: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Format de date invalide"),
  nationality: z.string().min(1, "La nationalité est requise")
});

const documentNumberSchema = z.object({
  type: z.enum(['passport', 'idCard', 'residencePermit', 'socialSecurity']),
  number: z.string().min(1, "Le numéro de document est requis")
});

export function validateDocumentFields(fields: any) {
  try {
    const validationSchema = z.object({
      address: addressSchema,
      personal: personalInfoSchema,
      document: documentNumberSchema
    });

    return validationSchema.safeParse(fields);
  } catch (error) {
    console.error('Validation error:', error);
    return { success: false, error };
  }
}