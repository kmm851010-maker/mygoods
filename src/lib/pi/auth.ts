export interface PiMeResponse {
  uid: string;
  username: string;
  credentials?: {
    scopes: string[];
    valid_until: { timestamp: number; iso8601: string };
  };
}

export async function verifyPiAccessToken(accessToken: string): Promise<PiMeResponse> {
  const response = await fetch('https://api.minepi.com/v2/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Pi token verification failed: ${response.status}`);
  }

  return response.json();
}
