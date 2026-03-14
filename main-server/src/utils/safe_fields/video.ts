export const videoSafeFields = {
  home: {
    id: true,
    title: true,
    thumbnails: true,
    duration: true,
    view_count: true,
    createdAt: true,
    creator: {
      select: {
        title: true,
      },
    },
  },
};
