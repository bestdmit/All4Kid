import { config } from '../config';

type MailboxLayerResponse = {
  email: string;
  did_you_mean?: string | null;
  format_valid: boolean;
  mx_found: boolean;
  smtp_check: boolean;
  catch_all: boolean | null;
  role: boolean;
  disposable: boolean;
  free: boolean;
  score?: number;
  error?: { code: number; type: string; info: string };
};

export async function verifyEmailDeliverability(email: string): Promise<{ isDeliverable: boolean; data?: MailboxLayerResponse; reason?: string }> {
  if (!config.emailValidation.accessKey) {
    return { isDeliverable: false, reason: 'EMAIL_VALIDATION_ACCESS_KEY is not configured' };
  }

  const url = new URL(config.emailValidation.baseUrl);
  url.searchParams.set('access_key', config.emailValidation.accessKey);
  url.searchParams.set('email', email);
  url.searchParams.set('smtp', '1');
  url.searchParams.set('format', '1');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.emailValidation.timeoutMs);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    const data = (await res.json()) as MailboxLayerResponse;

    if (!res.ok) {
      return { isDeliverable: false, data, reason: data?.error?.info || `HTTP ${res.status}` };
    }

    // Primary signal: smtp_check === true and mx_found === true
    const isDeliverable = Boolean(data.smtp_check) && Boolean(data.mx_found);
    return { isDeliverable, data, reason: isDeliverable ? undefined : 'SMTP check failed or MX not found' };
  } catch (err: any) {
    clearTimeout(timeout);
    const reason = err?.name === 'AbortError' ? 'Email validation request timed out' : (err?.message || 'Email validation request failed');
    return { isDeliverable: false, reason };
  }
}
