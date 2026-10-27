export let csrf = '';
export async function api<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) });
  let data; try { data = await response.json(); } catch { throw new Error('The kitchen is temporarily offline. Please try again shortly.'); }
  if (!response.ok) throw new Error(data.error || 'Could not complete your request.');
  if (data.csrf) csrf = data.csrf;
  return data;
}
export type Product = {id:string; name:string; category:string; description:string; image:string; unit:string; price:number|null; available:boolean; color:string};
export function priceLabel(price: number | null, currency: string) { return price === null ? 'Price on request' : new Intl.NumberFormat('en-GH',{style:'currency',currency}).format(price); }
