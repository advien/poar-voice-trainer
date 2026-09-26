/**
 * One place for the wording and the version of the privacy notice, so the
 * short notice by the record button, the consent log and the full policy page
 * can never drift apart.
 *
 * Bump POLICY_VERSION whenever the policy changes in a way a person would want
 * to know about. Consent rows carry the version they were given against, so an
 * old consent is never mistaken for agreement to new terms.
 */

export const POLICY_VERSION = "2026-09-26";

export const CONTACT_EMAIL = "adsnufkin@gmail.com";

/** Shown next to the consent checkbox, before the first recording. */
export const CONSENT_SUMMARY =
  "Your recording is sent to OpenAI to be transcribed and scored. Nothing is stored: no audio, no transcript, no scores. Results live in this browser tab and are gone when you close it.";

/** Shown once results are on screen. */
export const RESULT_DISCLAIMER =
  "Nothing here was saved — no audio, no transcript, no scores. Closing this page ends the session for good.";

/** The standing reminder shown once consent is given. */
export const CONSENT_STANDING =
  "Recording goes to OpenAI · nothing is stored";

/** localStorage key holding the accepted policy version. */
export const CONSENT_STORAGE_KEY = "vt_consent_version";
