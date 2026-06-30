"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Plus } from "lucide-react";
import { del, get, post } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { BookmarkCollection, VideoLibraryStatus } from "@/types/library";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BookmarkPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  onStatusChange?: () => void;
};

export function BookmarkPickerDialog({
  open,
  onClose,
  videoId,
  onStatusChange,
}: BookmarkPickerDialogProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: status, mutate: mutateStatus } = useSWR<VideoLibraryStatus>(
    open && videoId ? `/protected/library/videos/${videoId}/status` : null,
    (endpoint: string) => get({ endpoint, throwable: true }),
  );

  const { data: bookmarks, mutate: mutateBookmarks } = useSWR<
    BookmarkCollection[]
  >(open ? "/protected/library/bookmarks" : null, (endpoint: string) =>
    get({ endpoint, throwable: true }),
  );

  const refresh = async () => {
    await Promise.all([mutateStatus(), mutateBookmarks()]);
    onStatusChange?.();
  };

  const toggleBookmark = async (bookmarkId: string, isSelected: boolean) => {
    setTogglingId(bookmarkId);
    try {
      if (isSelected) {
        await del({
          endpoint: `/protected/library/bookmarks/${bookmarkId}/videos/${videoId}`,
          throwable: true,
        });
      } else {
        await post({
          endpoint: `/protected/library/bookmarks/${bookmarkId}/videos/${videoId}`,
          throwable: true,
        });
      }
      await refresh();
      onClose();
    } catch {
      alert("Could not update bookmark.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const created = (await post({
        endpoint: "/protected/library/bookmarks",
        params: { name: trimmed },
        throwable: true,
      })) as BookmarkCollection;
      await post({
        endpoint: `/protected/library/bookmarks/${created.id}/videos/${videoId}`,
        throwable: true,
      });
      setNewName("");
      setShowCreate(false);
      await refresh();
      onClose();
    } catch {
      alert("Could not create bookmark collection.");
    } finally {
      setCreating(false);
    }
  };

  const selectedIds = new Set(status?.bookmarkIds ?? []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to bookmark</DialogTitle>
        </DialogHeader>

        {!bookmarks ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {bookmarks.map((bookmark) => {
              const isSelected = selectedIds.has(bookmark.id);
              const isLoading = togglingId === bookmark.id;
              return (
                <button
                  key={bookmark.id}
                  type="button"
                  onClick={() => toggleBookmark(bookmark.id, isSelected)}
                  disabled={isLoading}
                  className={cn(
                    "mb-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left",
                    isSelected
                      ? "border-primary bg-primary/20"
                      : "border-border bg-card",
                  )}
                >
                  <div className="mr-3 min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-medium",
                        isSelected && "text-primary",
                      )}
                    >
                      {bookmark.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookmark.count} videos
                    </p>
                  </div>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : isSelected ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : null}
                </button>
              );
            })}

            {showCreate ? (
              <div className="mt-2 space-y-3">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  autoFocus
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="w-full"
                >
                  {creating ? "Creating..." : "Create and save"}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-3 hover:bg-muted"
              >
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">New collection</span>
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
