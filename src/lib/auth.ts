// Sign-in is not part of the OpenAPI spec: these are ms_api tRPC procedures.
// With no transformer, a tRPC mutation is a JSON POST to /trpc/<procedure>
// that answers `{ result: { data } }` or `{ error: { message } }`.
async function trpcMutation<T>(
  baseUrl: string,
  procedure: string,
  input: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}/trpc/${procedure}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(input),
  })
  const body = (await response.json().catch(() => null)) as {
    result: { data: T }
    error?: { message?: string }
  } | null
  if (!response.ok || !body) {
    throw new Error(body?.error?.message ?? `HTTP ${response.status}`)
  }
  return body.result.data
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export type TwoFactorMethod = 'SECURED_TOTP' | 'SECURED_EMAIL'

export interface TwoFactorChallenge {
  method: TwoFactorMethod
  /** Mid-login token: it can only complete the challenge. */
  pendingToken: string
  /** Masked address the e-mail code went to. */
  sentTo?: string
}

export type LoginResult =
  | { kind: 'signed-in'; tokens: Tokens }
  | { kind: 'two-factor'; challenge: TwoFactorChallenge }

interface LoginResponse {
  access_token?: string
  refresh_token?: string
  two_factor_state?: string[] | null
}

export async function login(
  baseUrl: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  const response = await trpcMutation<LoginResponse>(baseUrl, 'auth.login', {
    email,
    password,
  })
  const pending = response.two_factor_state ?? []
  if (
    pending.length === 0 &&
    response.access_token &&
    response.refresh_token
  ) {
    return {
      kind: 'signed-in',
      tokens: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      },
    }
  }

  const method = (['SECURED_TOTP', 'SECURED_EMAIL'] as const).find(m =>
    pending.includes(m),
  )
  if (!method || !response.access_token) {
    throw new Error(
      'Finish setting up two-factor authentication in the Stream Security app, then sign in here.',
    )
  }
  const sentTo =
    method === 'SECURED_EMAIL'
      ? await trpcMutation<string>(
          baseUrl,
          'twoFactor.requestVerification',
          { method },
          response.access_token,
        )
      : undefined
  return {
    kind: 'two-factor',
    challenge: { method, pendingToken: response.access_token, sentTo },
  }
}

export async function completeTwoFactor(
  baseUrl: string,
  challenge: TwoFactorChallenge,
  code: string,
): Promise<Tokens> {
  const response = await trpcMutation<{
    access_token: string
    refresh_token: string
  }>(
    baseUrl,
    'twoFactor.authenticate',
    { method: challenge.method, user_code: code.trim() },
    challenge.pendingToken,
  )
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export async function refreshAccessToken(
  baseUrl: string,
  refreshToken: string,
): Promise<string> {
  const response = await trpcMutation<{ access_token: string }>(
    baseUrl,
    'auth.refreshToken',
    { refresh_token: refreshToken },
  )
  return response.access_token
}
