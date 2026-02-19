
export async function authSignInRequest(username: string, password: string) {
  return fetch('api/auth/v1/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
}

export async function authRegisterRequest(payload: Record<string, any>) {
  return fetch('api/auth/v1/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function socialLoginUrl(provider: 'google' | 'facebook') {
  return `api/auth/v1/${provider}`;
}

export function processVideoRequest(formData: FormData) {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("auth_token");
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(`api/management/v1/managements`, {
    method: 'POST',
    headers,
    body: formData,
  });
}

export async function authConfirmRequest(payload: { email?: string; userId?: string; pin: string }) {
  return fetch('api/auth/v1/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function authResendConfirmRequest(payload: { email?: string; userId?: string }) {
  return fetch('api/auth/v1/resend-confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
