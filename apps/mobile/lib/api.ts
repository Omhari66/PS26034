/**
 * Typed API client for the PS 26034 backend.
 *
 * All network calls live here. Screens call these functions; they never
 * call fetch() directly. This makes the backend URL easy to change for
 * demo/staging environments.
 *
 * Phase 6: JWT auth wired. Token stored in AsyncStorage and injected
 * into every request via the `setTokenProvider` callback.
 */

import Constants from 'expo-constants';
import type {
  CreateInspectionResponse,
  ImageRole,
  ImageUploadResponse,
  InspectionReport,
  SetCategoryResponse,
  AnalyzeInspectionResponse,
  FieldCorrection,
} from './types';

// ─── Configuration ───────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000/api/v1`;
  }
  return 'http://10.0.2.2:8000/api/v1';
}

const BASE_URL = getBaseUrl();

// ─── Token provider (injected at app bootstrap) ───────────────────────────────

type TokenProvider = () => string | null;
let _tokenProvider: TokenProvider = () => null;

/**
 * Wire in the persisted JWT from AsyncStorage once on app startup:
 *   import AsyncStorage from '@react-native-async-storage/async-storage';
 *   setTokenProvider(() => tokenRef.current);   // see App.tsx pattern
 */
export function setTokenProvider(fn: TokenProvider) {
  _tokenProvider = fn;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  role: string;
  email: string;
}

/** POST /auth/login — call before setTokenProvider; no token required. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { detail: unknown }).detail ?? body);
  }
  return res.json() as Promise<LoginResponse>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = _tokenProvider();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let detail: unknown;
    try {
      const body = await res.json();
      detail = (body as { detail: unknown }).detail ?? body;
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    super(`API ${status}: ${JSON.stringify(detail)}`);
    this.name = 'ApiError';
  }
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/** Create a new inspection session. Returns the inspection_id. */
export async function createInspection(
  inspectorId: string,
): Promise<CreateInspectionResponse> {
  return request<CreateInspectionResponse>('/inspections', {
    method: 'POST',
    body: JSON.stringify({ inspector_id: inspectorId }),
  });
}

/**
 * Upload one product label image.
 * Uses XMLHttpRequest (not fetch) because React Native's fetch FormData
 * implementation can produce malformed multipart boundaries that Starlette
 * rejects with "unsupported form data part implementation".
 * XHR handles the { uri, name, type } file object natively on Android/iOS.
 */
export async function uploadImage(
  inspectionId: string,
  role: ImageRole,
  fileUri: string,
  mimeType: string = 'image/jpeg',
): Promise<ImageUploadResponse> {
  const url = `${BASE_URL}/inspections/${inspectionId}/images`;
  const token = _tokenProvider();

  return new Promise<ImageUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ImageUploadResponse);
        } catch {
          reject(new ApiError(xhr.status, 'Invalid JSON response'));
        }
      } else {
        let detail: unknown;
        try {
          const body = JSON.parse(xhr.responseText);
          detail = (body as { detail: unknown }).detail ?? body;
        } catch {
          detail = xhr.statusText;
        }
        reject(new ApiError(xhr.status, detail));
      }
    };

    xhr.onerror = () => reject(new ApiError(0, 'Network error'));
    xhr.ontimeout = () => reject(new ApiError(0, 'Upload timed out'));
    xhr.timeout = 30000; // 30 s

    const formData = new FormData();
    formData.append('role', role);
    // React Native FormData accepts { uri, name, type } — XHR handles this correctly
    formData.append('file', {
      uri: fileUri,
      name: `${role}.jpg`,
      type: mimeType,
    } as unknown as Blob);

    xhr.send(formData);
  });
}

/** Set the inspector-confirmed product category. */
export async function setCategory(
  inspectionId: string,
  category: string,
): Promise<SetCategoryResponse> {
  return request<SetCategoryResponse>(
    `/inspections/${inspectionId}/category`,
    { method: 'POST', body: JSON.stringify({ category }) },
  );
}

/**
 * Analyze the inspection images to produce a draft report (Phase 3.5).
 * Returns RuleResults and a category_mismatch flag.
 */
export async function analyzeInspection(
  inspectionId: string,
): Promise<AnalyzeInspectionResponse> {
  return request<AnalyzeInspectionResponse>(
    `/inspections/${inspectionId}/analyze`,
    { method: 'POST' },
  );
}

/**
 * Submit the inspection.
 * Phase 3.5+: backend uses uploaded images for OCR and accepts corrections for REVIEW fields.
 */
export async function submitInspection(
  inspectionId: string,
  corrections?: FieldCorrection[],
): Promise<InspectionReport> {
  return request<InspectionReport>(
    `/inspections/${inspectionId}/submit`,
    { method: 'POST', body: JSON.stringify({ corrections: corrections || [] }) },
  );
}

/** Retrieve a stored inspection report. */
export async function getReport(
  inspectionId: string,
): Promise<InspectionReport> {
  return request<InspectionReport>(`/inspections/${inspectionId}`);
}
