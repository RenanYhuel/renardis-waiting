export interface ContactFormData {
  nom: string;
  email: string;
  message: string;
}

export interface CandidatureFormData {
  nom: string;
  email: string;
  age?: number;
  competences?: string;
  message: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
  details?: unknown;
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
}
