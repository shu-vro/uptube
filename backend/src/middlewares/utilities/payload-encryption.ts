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
    req.params = req.params || {};
    req.body = req.body || {};

    if (!FLAGS.ALLOW_UNENCRYPTED_REQUESTS) {
      const encryptedParams = req.params.encrypted;
      const encryptedBody = req.body.encrypted;

      req.params = encryptedParams ? { encrypted: encryptedParams } : {};
      req.body = encryptedBody ? { encrypted: encryptedBody } : {};
    }

    const hasEncryptedParams = req.params.encrypted;
    const hasEncryptedBody = req.body.encrypted;

    if (!hasEncryptedParams && !hasEncryptedBody) {
      return next();
    }

    if (hasEncryptedParams) {
      try {
        const payload = JSON.parse(req.params.encrypted);
        const decryptedParams = decryptHybrid(payload);
        const parsedParams = JSON.parse(decryptedParams);

        req.params = {
          ...req.params,
          ...parsedParams,
        };
        delete req.params.encrypted;
      } catch (error: any) {
        logger.error("Failed to decrypt params:", error);
        return next(new Error("Invalid encrypted parameters"));
      }
    }

    // Decrypt body if present
    if (hasEncryptedBody) {
      try {
        const payload = JSON.parse(req.body.encrypted);
        const decryptedBody = decryptHybrid(payload);
        const parsedBody = JSON.parse(decryptedBody);

        req.body = {
          ...req.body,
          ...parsedBody,
        };
        delete req.body.encrypted;
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
