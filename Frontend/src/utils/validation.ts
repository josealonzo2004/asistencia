export const INSTITUTIONAL_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@universidad\.edu\.ec$/;

export function isInstitutionalEmail(email: string) {
  return INSTITUTIONAL_EMAIL_PATTERN.test(email.trim());
}
