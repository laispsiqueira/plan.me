export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class FileValidator {
  static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  static readonly ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
  static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  static readonly MAX_AUDIO_SIZE = 10 * 1024 * 1024;

  static validateImage(file: File): FileValidationResult {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: `Tipo inválido: ${file.type}. Use JPEG, PNG ou WebP.` };
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      return { 
        valid: false, 
        error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 5MB.` 
      };
    }

    return { valid: true };
  }

  static validateAudio(file: File): FileValidationResult {
    if (!this.ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return { valid: false, error: 'Tipo inválido. Use MP3, WAV ou OGG.' };
    }

    if (file.size > this.MAX_AUDIO_SIZE) {
      return { 
        valid: false, 
        error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 10MB.` 
      };
    }

    return { valid: true };
  }
}
