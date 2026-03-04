/** Image placeholder (SVG data URL) pour éviter les appels à via.placeholder.com (ERR_NAME_NOT_RESOLVED). */
export const PLACEHOLDER_PRODUCT_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="%23eee" width="300" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14">Produit</text></svg>'
  );

export const PLACEHOLDER_THUMB_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23eee" width="80" height="80"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">Image</text></svg>'
  );

/** Retourne l’URL à afficher : l’URL fournie si valide, sinon le placeholder (évite via.placeholder.com). */
export function safeProductImageUrl(url: string | undefined | null): string {
  if (!url || url.includes('via.placeholder.com')) {
    return PLACEHOLDER_PRODUCT_IMAGE;
  }
  return url;
}

/** Pour vignettes / panier (petit format). */
export function safeThumbImageUrl(url: string | undefined | null): string {
  if (!url || url.includes('via.placeholder.com')) {
    return PLACEHOLDER_THUMB_IMAGE;
  }
  return url;
}
