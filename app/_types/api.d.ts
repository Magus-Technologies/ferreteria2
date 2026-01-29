/**
 * Tipos base para las respuestas de la API de Laravel
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  exception?: string;
  file?: string;
  line?: number;
  trace?: Array<{
    file: string;
    line: number;
    function: string;
    class: string;
    type: string;
  }>;
}
