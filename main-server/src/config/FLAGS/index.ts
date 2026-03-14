const FLAGS = Object.freeze({
  FEATURE_X: true,
  FEATURE_Y: false,
  STOP_CONSOLE_AT_PROD: false || process.env.NODE_ENV !== "development",
  STOP_PINO_AT_PROD: false,
  ALLOW_UNENCRYPTED_REQUESTS: true,
  ENCRYPTED_RESPONSES_ONLY: false, // response encryption is on.
});

export const CLIENT_FLAGS = Object.freeze({
  ENCRYPT_REQUESTS: true,
  DOES_NOT_NEED_RESPONSE_ENCRYPTION: !FLAGS.ENCRYPTED_RESPONSES_ONLY,
});

export default FLAGS;
