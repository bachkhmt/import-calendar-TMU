import type { GoogleCalendarEventPayload } from './calendar-exporter';
import type { GoogleCalendarInsertResult } from './types';

// Default / fallback Client ID storage key in localStorage
export const STORAGE_KEY_CLIENT_ID = 'peoplesoft_gcal_client_id';
export const STORAGE_KEY_USER_EMAIL = 'peoplesoft_user_email';

export function getSavedClientId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';
}

export function saveClientId(clientId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
}

export function getSavedUserEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_USER_EMAIL) || '';
}

export function saveUserEmail(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_USER_EMAIL, email.trim());
}

/**
 * Initiates Google OAuth 2.0 Token Client popup via Google Identity Services
 */
export function requestGoogleAccessToken(
  clientId: string,
  userEmail?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return reject(
        new Error(
          'Google Identity Services SDK chưa sẵn sàng. Vui lòng kiểm tra kết nối internet hoặc thử tải lại trang.'
        )
      );
    }

    if (!clientId || !clientId.trim()) {
      return reject(
        new Error('Vui lòng nhập Google OAuth Client ID trước khi kết nối.')
      );
    }

    try {
      const initConfig: any = {
        client_id: clientId.trim(),
        scope:
          'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        callback: (resp: any) => {
          if (resp.error) {
            return reject(
              new Error(
                `Google OAuth lỗi: ${resp.error_description || resp.error}`
              )
            );
          }
          if (resp.access_token) {
            resolve(resp.access_token);
          } else {
            reject(new Error('Không nhận được access token từ Google.'));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'Người dùng đã huỷ đăng nhập Google.'));
        },
      };

      if (userEmail && userEmail.trim()) {
        initConfig.hint = userEmail.trim();
      }

      const tokenClient = google.accounts.oauth2.initTokenClient(initConfig);

      const requestConfig: any = { prompt: 'consent' };
      if (userEmail && userEmail.trim()) {
        requestConfig.hint = userEmail.trim();
      }

      tokenClient.requestAccessToken(requestConfig);
    } catch (e: any) {
      reject(new Error(`Lỗi khởi tạo token client: ${e.message}`));
    }
  });
}

/**
 * Creates a new dedicated calendar on Google Calendar
 */
export async function createGoogleCalendar(
  accessToken: string,
  calendarName: string,
  timeZone: string
): Promise<{ id: string; summary: string }> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: calendarName,
        description: 'Lịch học tự động tạo từ PeopleSoft Weekly Schedule Tool',
        timeZone,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Không thể tạo calendar mới: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return { id: data.id, summary: data.summary };
}

/**
 * Inserts recurring events into the newly created calendar one by one with progress tracking.
 */
export async function insertEventsToGoogleCalendar(
  accessToken: string,
  calendarId: string,
  events: { code: string; payload: GoogleCalendarEventPayload }[],
  onProgress?: (current: number, total: number, title: string, success: boolean) => void
): Promise<GoogleCalendarInsertResult> {
  const total = events.length;
  let successCount = 0;
  let failedCount = 0;
  const results: GoogleCalendarInsertResult['results'] = [];

  for (let i = 0; i < events.length; i++) {
    const item = events[i];
    let inserted = false;
    let eventId: string | undefined;
    let lastError = '';

    // Try insert, with 1 retry on failure
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.payload),
          }
        );

        if (res.ok) {
          const resData = await res.json();
          inserted = true;
          eventId = resData.id;
          break;
        } else {
          const errBody = await res.json().catch(() => ({}));
          lastError = errBody.error?.message || res.statusText;
          // Wait briefly before retry
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (err: any) {
        lastError = err.message;
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (inserted) {
      successCount++;
      results.push({
        courseCode: item.code,
        title: item.payload.summary,
        success: true,
        eventId,
      });
      onProgress?.(i + 1, total, item.payload.summary, true);
    } else {
      failedCount++;
      results.push({
        courseCode: item.code,
        title: item.payload.summary,
        success: false,
        error: lastError,
      });
      onProgress?.(i + 1, total, item.payload.summary, false);
    }
  }

  return {
    calendarId,
    calendarSummary: '',
    calendarUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarId)}`,
    successCount,
    failedCount,
    results,
  };
}
