# Standalone migration identity audit

## Public identity

Public-facing Tech Tinker Club branding and the legacy Tech Tinker Club email fallback have been removed from 99 Club Studio.

The standalone site is served from `https://99studio.uk/`, with the inherited website masthead hidden and Studio navigation presented inside the product UI.

## Public routes

The primary public routes are:

- `/`
- `/games/`
- `/play/`
- `/help/`
- `/help/games/`
- `/contact/`
- `/privacy/`

## Search and sharing identity

Public pages use `https://99studio.uk` as the canonical site URL. Page-specific titles and descriptions are defined for the main public routes, Open Graph metadata uses the 99 Club Studio wordmark, the site locale is `en-GB`, and the root page exposes Educational WebApplication structured data.

`/robots.txt` points crawlers to the generated sitemap and excludes the hidden Custom Worksheets workspace. The hidden workspace also emits `noindex,nofollow` and remains outside the sitemap.

## Compatibility

The former public `/tools/99-club/...` pages are redirect-only compatibility routes so existing links and bookmarks continue to resolve.

The hidden Custom Worksheets workspace remains at `/tools/99-club/custom/` and is intentionally excluded from public navigation and the sitemap.

The legacy narrow-scope PWA files remain in place so older installed copies can be retired safely by the root-scope PWA registration code.

## Remaining operational dependency

The contact form still delivers through FormSubmit to the existing legacy mailbox. The recipient address is not shown in the Studio interface or in contact-form error messages.

Files containing that delivery endpoint:

- `assets/99club/app.js`
- `assets/99club/banner-actions-v1.js`
- `assets/99club/banner-actions-v2.js`

Once a dedicated 99 Studio contact mailbox or form endpoint exists, those three delivery targets should be changed together.
