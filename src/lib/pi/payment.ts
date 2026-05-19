const PI_API_BASE = 'https://api.minepi.com';

function piHeaders() {
  return {
    Authorization: `Key ${process.env.PI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function getPiPayment(paymentId: string) {
  const response = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}`, {
    headers: piHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to get payment: ${response.status}`);
  return response.json();
}

export async function approvePiPayment(paymentId: string) {
  const response = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: piHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to approve payment: ${response.status}`);
  return response.json();
}

export async function completePiPayment(paymentId: string, txid: string) {
  const response = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/complete`, {
    method: 'POST',
    headers: piHeaders(),
    body: JSON.stringify({ txid }),
  });
  if (!response.ok) throw new Error(`Failed to complete payment: ${response.status}`);
  return response.json();
}
