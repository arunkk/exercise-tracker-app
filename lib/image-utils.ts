/**
 * Resolve a photo_url to a displayable src.
 * Data URLs are returned as-is; blob pathnames go through /api/file.
 */
export function resolvePhotoSrc(photoUrl: string): string {
  if (photoUrl.startsWith('data:')) return photoUrl
  return `/api/file?pathname=${encodeURIComponent(photoUrl)}`
}

/**
 * Resize an image file to a square thumbnail and return as a base64 data URL.
 * The image is center-cropped to a square, then scaled to `size` pixels.
 */
export function resizeImageToThumbnail(
  file: File,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      // Center-crop to square
      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
