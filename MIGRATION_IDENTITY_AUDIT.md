# Standalone migration identity audit

## Public identity

Public-facing Tech Tinker Club branding and the legacy Tech Tinker Club email fallback have been removed from 99 Club Studio.

The standalone site is served from `https://99studio.uk/`, with the inherited website masthead hidden and Studio navigation presented inside the product UI.

## Compatibility

The former Tech Tinker Club 99 Club pages are redirect-only compatibility pages. Existing links continue to resolve to their corresponding pages on `99studio.uk`.

The legacy `/tools/99-club/` path is also retained on the standalone site for old bookmarks and installed-app compatibility.

## Remaining operational dependency

The contact form still delivers through FormSubmit to the existing legacy mailbox. The recipient address is not shown in the Studio interface or in contact-form error messages.

Files containing that delivery endpoint:

- `assets/99club/app.js`
- `assets/99club/banner-actions-v1.js`
- `assets/99club/banner-actions-v2.js`

Once a dedicated 99 Studio contact mailbox or form endpoint exists, those three delivery targets should be changed together.
