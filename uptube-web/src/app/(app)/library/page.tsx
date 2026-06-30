"use client";

import { useState } from "react";
import useSWR from "swr";
import { get, post } from "@/lib/api";
import type { LibraryOverview } from "@/types/library";
import {
  BookmarkCollectionCard,
  LibraryMediaCard,
  LikedVideosCard,
  SectionHeader,
} from "@/components/library/library-cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LibraryPage() {
  const { data, error, isLoading, mutate } = useSWR<LibraryOverview>(
    "/protected/library/overview",
    (endpoint: string) => get({ endpoint, throwable: true }),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await post({
        endpoint: "/protected/library/bookmarks",
        params: { name: trimmed },
        throwable: true,
      });
      setName("");
      setCreateOpen(false);
      mutate();
    } catch {
      alert("Could not create bookmark collection.");
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="px-4 text-center text-destructive">
        Failed to load library.
      </p>
    );
  }

  return (
    <div className="py-4">
      {data.history.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="History" href="/library/history" />
          <div className="flex overflow-x-auto px-4 pb-2">
            {data.history.map((item) => (
              <LibraryMediaCard key={item.id} video={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <SectionHeader title="Bookmarks" onAdd={() => setCreateOpen(true)} />
        {data.likedVideos.count > 0 || data.bookmarks.length > 0 ? (
          <div className="flex overflow-x-auto px-4 pb-2">
            {data.likedVideos.count > 0 && (
              <LikedVideosCard
                count={data.likedVideos.count}
                preview={data.likedVideos.preview}
              />
            )}
            {data.bookmarks.map((b) => (
              <BookmarkCollectionCard key={b.id} bookmark={b} />
            ))}
          </div>
        ) : (
          <p className="px-4 text-sm text-muted-foreground">
            No bookmarks yet. Tap + to create a collection.
          </p>
        )}
      </section>

      {!data.history.length &&
        !data.likedVideos.count &&
        !data.bookmarks.length && (
          <p className="px-4 text-center text-sm text-muted-foreground">
            Watch videos to build your history, or like and bookmark content you
            enjoy.
          </p>
        )}

      <Dialog
        open={createOpen}
        onOpenChange={(v) => !v && setCreateOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New bookmark collection</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            autoFocus
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="w-full"
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
