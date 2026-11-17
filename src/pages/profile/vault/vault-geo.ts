export interface VaultGeoPoint {
  lat: number;
  lng: number;
  videoOffsetMs: number;
  inherited: boolean;
  mock: boolean;
  sampleId?: string;
  accuracy?: number;
  measuredVideoOffsetMs?: number;
  capturedAt?: string;
}

export interface VaultGeoSnapshot {
  state: string;
  signatureValid: boolean;
  points: VaultGeoPoint[];
  gaps: { startMs: number; endMs: number }[];
}

export function locationPoint(value: unknown, requireOffset = false): VaultGeoPoint | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const read = (raw: unknown) => typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;
  const lat = read(input['lat'] ?? input['latitude']);
  const lng = read(input['lng'] ?? input['lon'] ?? input['longitude']);
  const offset = requireOffset ? read(input['videoOffsetMs']) : 0;
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && Number.isFinite(offset) && offset >= 0)) return null;

  const accuracy = read(input['accuracy'] ?? input['accuracyMeters']);
  const measured = read(input['measuredVideoOffsetMs']);
  const capturedAt = input['capturedAt'] ?? input['timestamp'];
  return {
    lat,
    lng,
    videoOffsetMs: Math.round(offset),
    inherited: input['inherited'] === true,
    mock: input['mock'] === true,
    sampleId: typeof input['sampleId'] === 'string' ? input['sampleId'] : undefined,
    accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : undefined,
    measuredVideoOffsetMs: Number.isFinite(measured) ? Math.round(measured) : undefined,
    capturedAt: typeof capturedAt === 'string' && Number.isFinite(Date.parse(capturedAt)) ? capturedAt : undefined,
  };
}

export function decodeGeoSnapshot(value: unknown): VaultGeoSnapshot | null {
  if (!value || typeof value !== 'object') throw new Error('Invalid location response');
  const { geoTrack, signatureValid } = value as { geoTrack?: unknown; signatureValid?: unknown };
  if (geoTrack == null) return null;
  if (typeof geoTrack !== 'object') throw new Error('Invalid location track');
  const { state, points, gaps } = geoTrack as Partial<VaultGeoSnapshot>;
  const validPoints = (Array.isArray(points) ? points : []).slice(0, 20_000).map(point => {
    const decoded = locationPoint(point, true);
    if (!decoded) throw new Error('Invalid location coordinates');
    return decoded;
  }).sort((a, b) => a.videoOffsetMs - b.videoOffsetMs);
  const validGaps = (Array.isArray(gaps) ? gaps : []).slice(0, 20_000).map(gap => {
    if (!gap || !Number.isFinite(gap.startMs) || !Number.isFinite(gap.endMs) || gap.startMs < 0 || gap.endMs < gap.startMs) {
      throw new Error('Invalid location gap');
    }
    return gap;
  }).sort((a, b) => a.startMs - b.startMs);
  if (validGaps.some((gap, i) => i > 0 && gap.startMs < validGaps[i - 1].endMs)) {
    throw new Error('Overlapping location gaps');
  }
  return { state: typeof state === 'string' ? state : 'unavailable', signatureValid: signatureValid === true, points: validPoints, gaps: validGaps };
}

function lastAt<T>(items: readonly T[], position: number, time: (item: T) => number): T | null {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (time(items[middle]) <= position) low = middle + 1;
    else high = middle;
  }
  return low > 0 ? items[low - 1] : null;
}

export function locationAt(track: VaultGeoSnapshot, position: number) {
  const first = track.points[0];
  const preview = first && position < first.videoOffsetMs && ['available', 'partial'].includes(track.state);
  if (preview) return { point: first, preview: true };
  const point = lastAt(track.points, position, entry => entry.videoOffsetMs);
  const gap = lastAt(track.gaps, position, entry => entry.startMs);
  return { point: gap && position < gap.endMs && !point?.inherited ? null : point, preview: false };
}
