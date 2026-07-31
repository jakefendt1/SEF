import { useMemo, useState } from 'react';
import { MoreVertical, Search, FolderOpen } from 'lucide-react';
import type { StoredRoiCalculation } from '@/lib/roiCalculation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  calculations: StoredRoiCalculation[];
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * The saved-calculations screen.
 *
 * Replaces the old dropdown, which listed every calculation twice -- once to
 * load and once to delete -- as adjacent 30px rows, with the delete firing
 * instantly and no way back.
 */
export function SavedCalculationsTab({
  calculations,
  onLoad,
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('');
  const [renaming, setRenaming] = useState<StoredRoiCalculation | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<StoredRoiCalculation | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calculations;
    return calculations.filter((c) => c.name.toLowerCase().includes(q));
  }, [calculations, search]);

  if (calculations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-card rounded-xl border p-8 text-center">
        <FolderOpen className="size-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-base font-medium">No saved calculations yet.</p>
        <p className="text-base text-muted-foreground mt-1">
          Fill in the Calculator tab, then tap Save to keep it here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {calculations.length > 3 && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved calculations"
            aria-label="Search saved calculations"
            className="w-full h-12 pl-11 pr-4 rounded-xl border bg-card text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">Nothing matches "{search}".</p>
      ) : (
        visible.map((c) => (
          <div key={c.id} className="bg-card rounded-xl border flex items-stretch overflow-hidden">
            <button
              type="button"
              onClick={() => onLoad(c.id)}
              className="flex-1 min-w-0 text-left p-4 hover:bg-accent"
            >
              <span className="block text-base font-semibold truncate">{c.name}</span>
              <span className="block text-sm text-muted-foreground mt-0.5">
                Saved {new Date(c.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </button>
            <div className="flex items-center pr-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`More actions for ${c.name}`}
                    className="size-12 flex items-center justify-center rounded-lg hover:bg-accent"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => onLoad(c.id)}>Open</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameValue(c.name);
                      setRenaming(c);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(c.id)}>Make a copy</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleting(c)}
                    className="text-red-700 focus:text-red-700"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}

      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this calculation</DialogTitle>
            <DialogDescription>
              This only changes the name in your list. None of the numbers change.
            </DialogDescription>
          </DialogHeader>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            aria-label="Calculation name"
            className="w-full h-12 px-4 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRenaming(null)}
              className="min-h-[48px] px-4 rounded-lg border text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renaming) onRename(renaming.id, renameValue);
                setRenaming(null);
              }}
              className="min-h-[48px] px-4 rounded-lg bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50"
            >
              Save name
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) onDelete(deleting.id);
                setDeleting(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
