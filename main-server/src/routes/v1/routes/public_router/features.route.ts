import { CLIENT_FLAGS } from "config/FLAGS";
import { Router } from "express";
import { setCookie } from "utils/auth-utils/cookie-manager";
import { publicKey } from "utils/encryption";

const router = Router();

router.get("/", (req, res) => {
  // setCookie(res, "test", "whatever", {
  //   expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  // });
  req._success({
    encryption_public_key: publicKey,
    FEATURE_FLAGS: CLIENT_FLAGS,
  });
});

export default router;
