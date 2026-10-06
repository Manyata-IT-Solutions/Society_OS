/**
 * Standard API Response Envelope
 */
export interface ApiResponse<T = unknown> {
  data: T;
  meta?: ApiMeta;
  requestId: string;
}

export interface ApiMeta {
  timestamp: string;
  version?: string;
  pagination?: PaginationMeta | CursorPaginationMeta;
  [key: string]: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Standard API Error Detail and Response
 */
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
  requestId: string;
}
