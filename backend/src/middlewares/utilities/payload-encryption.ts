import FLAGS from "config/FLAGS";
import logger from "config/logger/pino.logger";
import { NextFunction, Request } from "express";
import { decryptHybrid } from "utils/encryption";

const payloadEncryptionMiddleware = (
  req: Request,
  _: any,
  next: NextFunction
) => {
  try {
    req.query = req.query || {};
    req.body = req.body || {};
    req.encrypted = false;
    if (!FLAGS.ALLOW_UNENCRYPTED_REQUESTS) {
      const encryptedParams = req.query.encrypted;
      const encryptedBody = req.body.encrypted;
      req.query = encryptedParams ? { encrypted: encryptedParams } : {};
      req.body = encryptedBody ? { encrypted: encryptedBody } : {};
    }
    const hasEncryptedParams = req.query?.encrypted || "";
    const hasEncryptedBody = req.body?.encrypted || "";
    if (!hasEncryptedParams && !hasEncryptedBody) {
      return next();
    }
    if (hasEncryptedParams) {
      try {
        const decryptedParams = decryptHybrid(hasEncryptedParams as string);
        const parsedParams = JSON.parse(decryptedParams);
        Object.assign(req.query, {
          ...req.query,
          ...parsedParams,
        });
        req.encrypted = true;
        delete req.query.encrypted;
        console.log(req.query);
      } catch (error: any) {
        console.error("Failed to decrypt params:", error);
        return next(new Error("Invalid encrypted parameters"));
      }
    }
    // Decrypt body if present
    if (hasEncryptedBody) {
      try {
        const decryptedBody = decryptHybrid(hasEncryptedBody as string);
        const parsedBody = JSON.parse(decryptedBody);
        Object.assign(req.body, {
          ...req.body,
          ...parsedBody,
        });
        req.encrypted = true;
        delete req.body.encrypted;
        console.log(req.body);
      } catch (error: any) {
        logger.error("Failed to decrypt body:", error);
        return next(new Error("Invalid encrypted body"));
      }
    }
    next();
  } catch (error) {
    console.error("Encryption middleware error:", error);
    next(error);
  }
};

export default payloadEncryptionMiddleware;
