interface ImportMetaEnv {
  readonly PUBLIC_RECAPTCHA_SITE_KEY: string;
  readonly RECAPTCHA_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
