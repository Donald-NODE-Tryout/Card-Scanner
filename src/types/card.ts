export interface VisitingCard {
  id?: string;
  business_name: string;
  person_name: string;
  contact_number: string;
  mobile_numbers?: string[];
  landline_number?: string;
  landline_numbers?: string[];
  whatsapp_number?: string;
  email?: string;
  emails?: string[];
  website?: string;
  websites?: string[];
  address?: string;
  pincode?: string;
  job_title?: string;
  business_category?: string;
  business_description?: string;
  notes?: string;
  tags?: string[];
  image_url?: string;
  raw_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExtractedCardData {
  business_name: string;
  person_name: string;
  contact_number: string;
  mobile_numbers?: string[];
  landline_number: string;
  landline_numbers?: string[];
  whatsapp_number: string;
  email: string;
  emails?: string[];
  website: string;
  websites?: string[];
  address: string;
  pincode?: string;
  job_title: string;
  business_category: string;
  business_description?: string;
  raw_text: string;
}
