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

// ...existing code...
