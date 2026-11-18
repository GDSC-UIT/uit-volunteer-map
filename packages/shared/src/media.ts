/** Client/provider UX limits; the unsigned provider preset must enforce these too. */
export const MEDIA_LIMITS = {
  maxImages: 4,
  maxImageBytes: 5 * 1024 * 1024,
  imageMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;
