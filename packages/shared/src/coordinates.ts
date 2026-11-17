/** WGS84 decimal degrees. Null means no confirmed location; never infer (0, 0). */
export interface PostCoordinates {
  latitude: number;
  longitude: number;
}

export function isPostCoordinates(value: unknown): value is PostCoordinates {
  if (typeof value !== 'object' || value === null) return false;
  const point = value as Partial<PostCoordinates>;
  return typeof point.latitude === 'number' && Number.isFinite(point.latitude)
    && point.latitude >= -90 && point.latitude <= 90
    && typeof point.longitude === 'number' && Number.isFinite(point.longitude)
    && point.longitude >= -180 && point.longitude <= 180;
}
