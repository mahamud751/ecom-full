/** Storefront names should read as English for a Bangladesh shopper. */

const FOREIGN_CHARS = /[äöüßàâæçéèêëîïôœùûÿñáíóúãõşğıİı]/i;

const FOREIGN_WORDS =
  /\b(und|der|die|das|dem|den|mit|für|von|auf|im|ist|ein|eine|kopfhaut|badeschaum|zahnpasta|dentrifice|shampooing|antipelliculaire|sérum|sirop|naturel|sans|aux|extrait|lait|duschgel|körper|hautpflege|feuchtigkeit|tägliche|dagcrème|hyaluronzuur|andickungsmittel|nahrungssupplement|galletas|tostada|nemlendirici|sıvı|sabun|diş|macunu|kräuter|orchidee|pour|avec|cheveux|visage|soin|gelée|jabón|crema|pasta|dientes|bioaktif|antirrugas|uniformizador|restaurador|rugas|tonalidade|acondicionador|hidratante|sabor|vainilla|repara|protege|locion|loción|champu|champú)\b/i;

export function isShopperEnglish(name: string): boolean {
  const s = (name || "").trim();
  if (s.length < 8) return false;
  if (FOREIGN_CHARS.test(s)) return false;
  if (FOREIGN_WORDS.test(s)) return false;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  const compact = s.replace(/\s+/g, "");
  if (!compact.length || letters / compact.length < 0.78) return false;
  return true;
}
