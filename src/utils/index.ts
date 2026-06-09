import type { IconItem } from '../types';
import { generateId } from '../store/useAppStore';

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageSize(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function createIconItem(file: File): Promise<IconItem> {
  const dataUrl = await fileToDataUrl(file);
  const size = await getImageSize(dataUrl);
  const name = file.name.replace(/\.[^/.]+$/, '');
  return {
    id: generateId(),
    name,
    originalName: file.name,
    width: size.width,
    height: size.height,
    dataUrl,
    addedAt: Date.now(),
  };
}

export async function createIconItems(files: FileList | File[]): Promise<IconItem[]> {
  const fileArray = Array.from(files).filter((f) =>
    /^image\/(png|jpe?g|gif|webp|svg\+xml)$/i.test(f.type)
  );
  return Promise.all(fileArray.map(createIconItem));
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadText(text: string, filename: string, mime: string = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
