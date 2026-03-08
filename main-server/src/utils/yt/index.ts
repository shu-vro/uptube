export const sanitizeYtUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("v");
  } catch (e) {
    const params = new URLSearchParams(url);
    if (params.has("v")) {
      return params.get("v");
    }
    if (url.length === 11) return url;
    return null;
  }
};
