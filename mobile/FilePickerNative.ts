/**
 * Native Mobile File Picker for React Native / Expo
 * Replaces standard HTML <input type="file"> using expo-document-picker
 * and converts files into base64 streams for the Gemini AI Tutor.
 */

export interface NativePickedFile {
  name: string;
  size?: number;
  mimeType: string;
  uri: string;
  base64?: string;
  text?: string;
}

/**
 * Picks a PDF, image, or study notes document on iOS / Android
 * and converts it to a base64 payload ready for the backend AI Tutor.
 */
export async function pickStudyDocumentNative(): Promise<NativePickedFile | null> {
  try {
    // Dynamic import to support Expo environments
    const DocumentPicker = await import('expo-document-picker');
    const FileSystem = await import('expo-file-system');

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType || 'application/octet-stream',
      uri: asset.uri,
      base64,
    };
  } catch (error) {
    console.error('Error in native document picker:', error);
    throw error;
  }
}

/**
 * Uploads picked native study material to the AI Tutor endpoint
 */
export async function uploadToTutorNative({
  backendBaseUrl,
  question,
  file,
  materialText,
}: {
  backendBaseUrl: string;
  question: string;
  file?: NativePickedFile;
  materialText?: string;
}) {
  const url = `${backendBaseUrl.replace(/\/+$/, '')}/api/gemini/tutor/qa`;

  const payload: any = {
    question,
    material: materialText || (file?.name ? `File: ${file.name}` : ''),
  };

  if (file?.base64) {
    payload.imageBase64 = `data:${file.mimeType};base64,${file.base64}`;
    payload.imageMimeType = file.mimeType;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Tutor API failed with status ${response.status}`);
  }

  return response.json();
}
