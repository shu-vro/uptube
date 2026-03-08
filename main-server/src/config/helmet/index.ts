import type { HelmetOptions } from "helmet";

export const helmetConfig: HelmetOptions = {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    xPoweredBy: false,
};
