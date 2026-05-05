const BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

type TokenResponse = {
  access: string;
  access_expires: number;
};

type RefreshTokenResponse = {
  refresh: string;
  refresh_expires: number;
};

async function getRefreshToken() {
  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error("Missing GoCardless credentials");
  }

  const response = await fetch(`${BASE_URL}/token/new/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      secret_id: secretId,
      secret_key: secretKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`GoCardless token/new failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<RefreshTokenResponse>;
}

async function getAccessToken() {
  const refresh = await getRefreshToken();

  const response = await fetch(`${BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ refresh: refresh.refresh }),
  });

  if (!response.ok) {
    throw new Error(`GoCardless token/refresh failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access;
}

export async function gocardlessFetch<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GoCardless request failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}
