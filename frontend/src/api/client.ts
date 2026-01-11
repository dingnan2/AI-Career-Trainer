/**
 * API client for AI Career Trainer backend.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8002/api' : '/api');

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================
// Types
// ============================================

export interface SessionResponse {
  session_id: string;
  expires_at: string;
  has_resume: boolean;
}

export interface ResumeUploadResponse {
  session_id: string;
  file_name: string;
  file_type: string;
  text_chars: number;
}

export interface JdGapRequest {
  session_id: string;
  jd_text: string;
  target_role?: string;
  openai_key?: string; // Optional: user-provided key
}

export interface Strength {
  point: string;
  evidence: string;
}

export interface Gap {
  point: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface Keyword {
  jd_keyword: string;
  evidence?: string;
  recommended_phrase: string;
}

export interface JdGapResult {
  match_score: number;
  summary: string;
  strengths: Strength[];
  gaps: Gap[];
  keywords: Keyword[];
  craft_questions: string[];
}

// ============================================
// API Client
// ============================================

class CareerTrainerClient {
  /**
   * Create a new anonymous session.
   */
  async createSession(): Promise<SessionResponse> {
    console.log('API: Creating session at', `${API_BASE}/sessions`);
    const response = await fetchWithTimeout(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, 5000);

    console.log('API: Create session response status:', response.status);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API: Create session failed:', error);
      throw new Error(error.detail || 'Failed to create session');
    }
    const data = await response.json();
    console.log('API: Session created:', data);
    return data;
  }

  /**
   * Get session status.
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await fetchWithTimeout(
      `${API_BASE}/sessions/${sessionId}`,
      undefined,
      5000
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found or expired');
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to get session');
    }
    return response.json();
  }

  /**
   * Upload resume file.
   */
  async uploadResume(
    sessionId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<ResumeUploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${API_BASE}/sessions/${sessionId}/resume`);
      xhr.send(formData);
    });
  }

  /**
   * Analyze JD gap.
   */
  async analyzeJdGap(request: JdGapRequest, apiKey?: string): Promise<JdGapResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Pass user's API key in header if provided
    if (apiKey) {
      headers['X-OpenAI-Key'] = apiKey;
    }

    const response = await fetchWithTimeout(`${API_BASE}/analyze/jd-gap`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    }, 60000);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Analysis failed');
    }
    return response.json();
  }

  /**
   * Health check.
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('API: Checking health at', `${API_BASE}/health`);
      const response = await fetchWithTimeout(
        `${API_BASE}/health`,
        undefined,
        2500
      );
      console.log('API: Health response status:', response.status);
      return response.ok;
    } catch (e) {
      console.error('API: Health check failed:', e);
      return false;
    }
  }
}

export const apiClient = new CareerTrainerClient();

