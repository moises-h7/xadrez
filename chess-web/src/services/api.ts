export async function getAnalysisFromFen(fen: string) {
  const res = await fetch('https://chess-api.com/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fen })
  });
  if (!res.ok) throw new Error('Falha na API: ' + res.statusText);
  return res.json();
}
