import { PNG } from 'pngjs';

// Remove the baked tile corners and edge while preserving the central artwork
// at its original coordinates. The guard prevents clipping newly added artwork.
export function squareArtwork(source, ground, textureTolerance = 0) {
  const size = source.width, inset = size * 80 / 1024, guard = size * 16 / 1024;
  if (![512, 1024].includes(size) || source.height !== size) throw new Error('Expected square 512px or 1024px source artwork.');
  const rgba = [...ground.match(/[a-f0-9]{2}/gi).map(hex => parseInt(hex, 16)), 255];
  const result = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const offset = (y * size + x) * 4;
    const distance = Math.min(x, y, size - 1 - x, size - 1 - y), inside = distance >= inset;
    if (inside && distance < inset + guard &&
        rgba.some((value, channel) => Math.abs(source.data[offset + channel] - value) > (channel === 3 ? 0 : textureTolerance))) {
      throw new Error('Artwork reaches the cleanup boundary; inspect the source before adding this variant.');
    }
    // Green's reviewed boundary has only subtle ground texture. Fade that texture
    // into the extended field; preserve the bills and interior texture exactly.
    const mix = !inside ? 0 : textureTolerance ? Math.min(1, (distance - inset) / guard) : 1;
    for (let channel = 0; channel < 4; channel++) result.data[offset + channel] = Math.round(rgba[channel] + mix * (source.data[offset + channel] - rgba[channel]));
  }
  return result;
}
