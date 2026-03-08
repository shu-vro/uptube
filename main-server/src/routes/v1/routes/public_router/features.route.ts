import { CLIENT_FLAGS } from "config/FLAGS";
import { Router } from "express";
import { publicKey } from "utils/encryption";

const router = Router();

router.get("/", (req) => {
  req._success({
    encryption_public_key: publicKey,
    FEATURE_FLAGS: CLIENT_FLAGS,
  });
});

export default router;
