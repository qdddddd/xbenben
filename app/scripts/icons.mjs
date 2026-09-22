import { PNG } from 'pngjs';
import fs from 'node:fs';
for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const png = new PNG({ width: size, height: size });
  const rect = (x, y, w, h, rgb) => {
    for (let py = Math.floor(y / 512 * size); py < (y + h) / 512 * size; py++) {
      for (let px = Math.floor(x / 512 * size); px < (x + w) / 512 * size; px++) {
        const i = (py * size + px) * 4; png.data.set([...rgb, 255], i);
      }
    }
  };
  rect(0, 0, 512, 512, [242, 242, 243]);
  const c = [89, 128, 166];
  rect(116, 116, 280, 3, c); rect(116, 396, 280, 3, c); rect(116, 116, 3, 280, c); rect(396, 116, 3, 280, c);
  for (const x of [116, 396]) for (const y of [116, 396]) { rect(x - 20, y, 40, 3, c); rect(x, y - 20, 3, 40, c); }
  rect(199, 170, 37, 172, [65, 97, 128]); rect(199, 312, 120, 30, [65, 97, 128]);
  fs.writeFileSync(new URL('../public/icons/' + file, import.meta.url), PNG.sync.write(png));
}
