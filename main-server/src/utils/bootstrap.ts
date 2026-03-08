import ENV from "config/env";
import path from "path";
import FLAGS from "config/FLAGS";
import { User } from "generated/prisma/client";
import { Log } from "youtubei.js";

(["log", "warn", "error", "info"] as const).forEach((level) => {
  const original = console[level].bind(console);
  (console as any)[level] = (...args: any[]) => {
    if (ENV.NODE_ENV === "development") {
      const stack = new Error().stack?.split("\n")[2];
      const match =
        stack?.match(/at (.+):(\d+):(\d+)/) ||
        stack?.match(/at (.+) \((.+):(\d+):(\d+)\)/);
      if (match) {
        const [_, fileOrMethod, maybeLine, maybeColumn, file, line, column] =
          match;
        if (file) {
          const relativeFile = path.relative(
            path.join(process.cwd(), "../"),
            file
          );
          original(
            `[${level}][${relativeFile}:${line}:${column}] ${fileOrMethod}:`,
            ...args
          );
        } else {
          const relativeFile = path.relative(
            path.join(process.cwd(), "../"),
            fileOrMethod
          );
          original(
            `[${level}][${relativeFile}:${maybeLine}:${maybeColumn}]:`,
            ...args
          );
        }
      } else {
        original(...args);
      }
    } else {
      FLAGS.STOP_CONSOLE_AT_PROD ? null : original(...args);
    }
  };
});

// Available levels: NONE, ERROR, WARNING, INFO, DEBUG
Log.setLevel(Log.Level.NONE);

declare global {
  namespace Express {
    interface Request {
      _success: (json: any, status?: number) => void;
      _error: (message: any, status?: number) => void;
      user?: User | null;
      encrypted?: boolean;
      requestSent: boolean;
    }
  }
}
