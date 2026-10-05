// Step 3: photos and notes. Photos stay on this device (see lib/onetrack/photos)
// and go into the PDF; the page says so in plain words.
import { useRef, useState } from 'react'
import { Camera, ImagePlus, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  PHOTO_TAGS,
  addPhoto,
  deletePhoto,
  downscale,
  photoTagLabel,
  putPhoto,
  type BomPhoto,
  type PhotoTag,
} from '@/lib/onetrack/photos'
import { fieldLabel } from './controls'

export function PhotosStep({
  bomId,
  photos,
  onPhotosChanged,
  showChecklist,
  notes,
  onNotes,
}: {
  bomId: string
  photos: readonly BomPhoto[]
  onPhotosChanged: () => void
  /** True when the BOM has a wearstrip line: show the worksheet's photo checklist. */
  showChecklist: boolean
  notes: string
  onNotes: (v: string) => void
}) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const pendingTag = useRef<PhotoTag | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<BomPhoto | null>(null)

  const pick = (tag: PhotoTag | null, from: 'camera' | 'library') => {
    pendingTag.current = tag
    ;(from === 'camera' ? cameraInput : libraryInput).current?.click()
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    let added = 0
    try {
      for (const file of Array.from(files)) {
        const img = await downscale(file)
        await addPhoto(bomId, pendingTag.current, img)
        added++
      }
      toast.success(added === 1 ? 'Photo added' : `${added} photos added`)
    } catch (err) {
      console.error('[onetrack photo]', err)
      toast.error(`Couldn't add that photo${added ? ` (${added} did go in)` : ''}. Try again, or take it with the camera.`)
    } finally {
      setBusy(false)
      onPhotosChanged()
      if (cameraInput.current) cameraInput.current.value = ''
      if (libraryInput.current) libraryInput.current.value = ''
    }
  }

  const saveCaption = async (p: BomPhoto, caption: string) => {
    try {
      await putPhoto({ ...p, caption })
    } catch {
      toast.error("Couldn't save that caption.")
    }
    onPhotosChanged()
  }

  const addButtons = (tag: PhotoTag | null) => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="min-h-[48px] text-base" disabled={busy} onClick={() => pick(tag, 'camera')}>
        <Camera className="size-5" /> Take photo
      </Button>
      <Button variant="outline" className="min-h-[48px] text-base" disabled={busy} onClick={() => pick(tag, 'library')}>
        <ImagePlus className="size-5" /> From library
      </Button>
    </div>
  )

  const thumbs = (list: readonly BomPhoto[]) =>
    list.length > 0 && (
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.id} className="rounded-lg border border-border bg-white p-2 space-y-2">
            <img src={p.dataUrl} alt={p.caption || photoTagLabel(p.tag)} className="w-full aspect-[4/3] object-cover rounded-md" />
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={p.caption}
                placeholder="Caption (optional)"
                aria-label="Caption"
                onBlur={(e) => e.target.value !== p.caption && saveCaption(p, e.target.value)}
                className="flex-1 min-w-0 h-12 px-3 text-base bg-white border border-gray-400 rounded-lg"
              />
              <Button variant="ghost" size="icon" className="size-12 text-muted-foreground" onClick={() => setDeleting(p)} aria-label="Delete photo">
                <Trash2 className="size-5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )

  const untagged = photos.filter((p) => !p.tag || !showChecklist)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">3. Photos and notes</h3>
        <p className="text-base text-muted-foreground">Photos help CS match what's there. They go into the PDF.</p>
      </div>
      <p className="flex gap-2 rounded-lg bg-secondary px-3 py-2 text-base">
        <Smartphone className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
        Photos are kept on this device and go into the PDF. They don't sync to your other devices.
      </p>

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <input ref={libraryInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />

      {showChecklist &&
        PHOTO_TAGS.map((t) => {
          const mine = photos.filter((p) => p.tag === t.id)
          return (
            <section key={t.id} className="rounded-xl border border-border bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-semibold">{t.label}</h4>
                <span className={mine.length ? 'text-sm font-semibold text-savings-green' : 'text-sm text-muted-foreground'}>
                  {mine.length ? `${mine.length} taken` : 'None yet'}
                </span>
              </div>
              {thumbs(mine)}
              {addButtons(t.id)}
            </section>
          )
        })}

      <section className="rounded-xl border border-border bg-white p-3 space-y-3">
        <h4 className="text-base font-semibold">{showChecklist ? 'Other photos' : 'Photos'}</h4>
        {thumbs(untagged)}
        {addButtons(null)}
      </section>

      <div>
        <label htmlFor="bom-notes" className={fieldLabel}>
          Notes for CS <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="bom-notes"
          rows={4}
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          className="w-full rounded-lg border border-gray-400 p-3 text-base bg-white"
        />
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[48px]">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[48px] bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (deleting) {
                  try {
                    await deletePhoto(deleting.id)
                  } catch {
                    toast.error("Couldn't delete that photo.")
                  }
                  onPhotosChanged()
                }
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
