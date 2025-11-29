interface ImportMetaEnv {
  readonly PUBLIC_RECAPTCHA_SITE_KEY: string;
  readonly RECAPTCHA_SECRET_KEY: string;
  readonly CONTACT_US_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
