const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export async function fetchHealth() {
  const response = await fetch(`${apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error("API health check failed.");
  }

  return (await response.json()) as { ok: boolean; service: string; timestamp: string };
}
