import { PNG } from 'pngjs';

// Remove the baked tile corners and edge while preserving the central artwork
// at its original coordinates. The guard prevents clipping newly added artwork.
export function squareArtwork(source, ground) {
  const size = 1024, inset = 80, guard = 16;
  if (source.width !== size || source.height !== size) throw new Error('Expected 1024px original artwork.');
  const rgba = [...ground.match(/[a-f0-9]{2}/gi).map(hex => parseInt(hex, 16)), 255];
  const result = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const offset = (y * size + x) * 4;
    const inside = x >= inset && x < size - inset && y >= inset && y < size - inset;
    if (inside && (x < inset + guard || y < inset + guard || x >= size - inset - guard || y >= size - inset - guard) &&
        rgba.some((value, channel) => source.data[offset + channel] !== value)) {
      throw new Error('Artwork reaches the cleanup boundary; inspect the source before adding this variant.');
    }
    for (let channel = 0; channel < 4; channel++) result.data[offset + channel] = inside ? source.data[offset + channel] : rgba[channel];
  }
  return result;
}
