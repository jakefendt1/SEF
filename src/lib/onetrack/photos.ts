// Photos for a OneTrack BOM. They stay on this device, in IndexedDB, keyed by
// the BOM's id: a Firestore document caps at 1 MB, and one phone photo is
// bigger than that. They go into the PDF. The UI says, in plain words, that
// they don't sync to the rep's other devices.
import { openDB, type IDBPDatabase } from 'idb'

/** The Word worksheet's photo checklist. */
export const PHOTO_TAGS = [
  { id: 'whole-conveyor', label: 'Whole conveyor' },
  { id: 'layout', label: 'Wearstrip layout' },
  { id: 'end-profile', label: 'Straight-on end profile, with a ruler' },
  { id: 'mounting', label: 'Mounting / frame' },
  { id: 'damage', label: 'Damage or wear' },
] as const

export type PhotoTag = (typeof PHOTO_TAGS)[number]['id']

export function photoTagLabel(tag: PhotoTag | null): string {
  return PHOTO_TAGS.find((t) => t.id === tag)?.label ?? 'Photo'
}

export interface BomPhoto {
  id: string
  bomId: string
  tag: PhotoTag | null
  caption: string
  /** JPEG data URL, at most 1600 px on the long edge. */
  dataUrl: string
  w: number
  h: number
  createdAt: number
}

const DB_NAME = 'onetrack-photos'
const STORE = 'photos'
let dbPromise: Promise<IDBPDatabase> | null = null

function photosDb() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('bomId', 'bomId')
    },
  })
  return dbPromise
}

export async function listPhotos(bomId: string): Promise<BomPhoto[]> {
  const db = await photosDb()
  const all = (await db.getAllFromIndex(STORE, 'bomId', bomId)) as BomPhoto[]
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function putPhoto(photo: BomPhoto): Promise<void> {
  const db = await photosDb()
  await db.put(STORE, photo)
}

/** Store a new photo for a BOM. */
export async function addPhoto(
  bomId: string,
  tag: PhotoTag | null,
  img: { dataUrl: string; w: number; h: number },
): Promise<void> {
  await putPhoto({ id: crypto.randomUUID(), bomId, tag, caption: '', ...img, createdAt: Date.now() })
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await photosDb()
  await db.delete(STORE, id)
}

export async function deletePhotosFor(bomId: string): Promise<void> {
  for (const p of await listPhotos(bomId)) await deletePhoto(p.id)
}

export const PHOTO_MAX_EDGE = 1600
export const PHOTO_QUALITY = 0.8

/** Downscale a camera file to a JPEG data URL. Browser only. */
export async function downscale(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser could not read the photo.')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return { dataUrl: canvas.toDataURL('image/jpeg', PHOTO_QUALITY), w, h }
}
