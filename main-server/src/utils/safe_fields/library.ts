export const libraryVideoSelect = {
  id: true,
  title: true,
  thumbnails: true,
  duration: true,
  type: true,
  view_count: true,
  createdAt: true,
  creator: {
    select: {
      title: true,
      avatars: true,
    },
  },
} as const;
