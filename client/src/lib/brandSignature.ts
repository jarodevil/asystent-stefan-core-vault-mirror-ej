/** Official Jaro'Devil signature for generated and printed Stefan documents. */
export const JARODEVIL_SIGNATURE_URL = "/manus-storage/jarodevil-signature-2026_1a872b38.png";

/** Loads the protected signature as a data URL for client-side PDF generators. */
export async function loadJaroDevilSignatureDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(JARODEVIL_SIGNATURE_URL);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
