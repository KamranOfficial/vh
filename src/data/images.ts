const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/img/*.{webp,jpg,jpeg,png}',
  { eager: true }
);

const map = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const file = path.split('/').pop()!;
  map.set(file, mod.default);
  map.set(file.replace(/\.\w+$/, ''), mod.default);
}

export function img(name: string): ImageMetadata {
  const found = map.get(name);
  if (!found) throw new Error(`Image not found: ${name}`);
  return found;
}

export const allImageNames = [...new Set([...map.keys()].filter((k) => k.includes('.')))].sort();
