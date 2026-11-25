import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

// Ensure base upload directory exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

/**
 * Safely delete a local file by relative path or URL
 * Guarded against path traversal attacks
 * @param {string} fileIdentifier - e.g. "/uploads/products/123.jpg" or "products/123.jpg"
 */
export const deleteLocalFile = async (fileIdentifier) => {
  if (!fileIdentifier || typeof fileIdentifier !== 'string') return false;

  // Ignore external remote URLs (e.g. Unsplash seed images)
  if (fileIdentifier.startsWith('http://') || fileIdentifier.startsWith('https://')) {
    // If it's a URL pointing to localhost/uploads, extract the pathname
    try {
      const parsed = new URL(fileIdentifier);
      if (parsed.pathname.startsWith('/uploads/')) {
        fileIdentifier = parsed.pathname;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  try {
    // Strip leading "/uploads/" or "uploads/"
    let relative = fileIdentifier.trim();
    if (relative.startsWith('/uploads/')) {
      relative = relative.replace('/uploads/', '');
    } else if (relative.startsWith('uploads/')) {
      relative = relative.replace('uploads/', '');
    }

    const targetPath = path.resolve(UPLOADS_ROOT, relative);

    // Strict path traversal check: targetPath must be inside UPLOADS_ROOT
    if (!targetPath.startsWith(UPLOADS_ROOT)) {
      console.warn(`[Security Alert] Potential path traversal blocked: ${fileIdentifier}`);
      return false;
    }

    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      console.log(`[Storage] Deleted local file: ${targetPath}`);
      return true;
    }
  } catch (err) {
    console.warn(`[Storage] Failed to delete file ${fileIdentifier}:`, err.message);
  }

  return false;
};
