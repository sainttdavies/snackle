# Snackle

React + Vite storefront with Vercel Functions and a Neon Postgres backend. Keeps Snackle's orange, cocoa, cream and teal branding and full-screen stacking sections. Crumbl informed the clear menu/catering paths; no Crumbl assets are used.

## Local preview

Requires Node.js 20 or newer and a Neon Postgres connection string.

```sh
npm install
npx vercel dev
```

Alternatively, `npm run dev` previews the frontend only. Add these values to a local `.env` before using the API or running owner setup:

```dotenv
DATABASE_URL=postgres://...neon.tech/neondb?sslmode=require
APP_ORIGIN=http://localhost:3000
```

For a frontend-only preview:

```sh
npm run dev
```

## Activate the single owner

```sh
npm run setup:admin
```

The interactive prompt sets a hidden password for **cindyafidoku0@gmail.com**. Use at least 14 characters. No password is seeded, printed, checked into source or sent in chat. Sign in using the private `/#/manage/...` link printed during setup. If you lose it, run `npm run admin:link` with the same `DATABASE_URL`. The public config endpoint does not expose this link. There is no public signup or first-visitor account claiming. The database constrains the owner table to one account.

For a forgotten password, run `npm run setup:admin -- --reset-password` on the server. This revokes existing sessions.

## Owner tools

- Orders & bookings: review contact details, preferred date, requests and notes; update internal status. Contact customers separately: no automated emails or WhatsApp messages are sent.
- Menu & pricing: add, edit and remove products, including names, descriptions, categories, images, colours, display order, prices, portion sizes and availability. Empty prices mean quote requests. Currency defaults to **GHS** and is editable in the website editor.
- Website editor: edit brand identity, navigation, service options, all customer-facing page and form copy, images, footer, loading states, 404 page and full-screen sections. Each section can override its collection label, badge, side note and menu category. Add up to 12 images per carousel, upload PNG/JPEG/WebP files (4 MB each), reorder/remove images, or use HTTPS image URLs. Uploaded images are stored in Neon. The editor shows whether changes are unpublished, and its preview uses the current draft. Publish changes to make them visible to visitors.
- Loading editor: set the image placeholder, product skeleton thumbnail, skeleton count, colours, corner radius, shimmer and error text. The editor includes a live skeleton preview.
- Carousels rotate every five seconds while visible. Hover or keyboard focus pauses motion; manual arrows/swipes pause autoplay until Play is selected. Reduced-motion preferences disable autoplay and transitions. Arrow keys work when the carousel is focused. Single-image carousels disable rotation controls.

## Customer behaviour

- Browse and filter bites and drinks; maintain a device-local basket with product IDs and quantities only.
- Submit pickup/delivery order requests and event enquiries. No payment is collected and no date is automatically reserved.
- Submitted records are stored on the server. Prices, availability and totals are resolved from the server catalog, ignoring client-supplied prices. Delivery charges and final totals require owner confirmation.
- Requests remain pending until the owner confirms availability and pricing directly with the customer.

## Production deployment

Vercel deploys the Vite frontend and every TypeScript file in `api/` as a function.

1. Create a Neon project and copy its pooled Postgres connection string.
2. In the Vercel project's Production environment, add `DATABASE_URL` (spelled exactly) and `APP_ORIGIN=https://grab-snackle.vercel.app`.
3. Push the repository to the production branch or deploy it with Vercel. A successful build must include the functions under `api/`.
4. Verify `https://grab-snackle.vercel.app/api/catalog` returns JSON.
5. Put the same `DATABASE_URL` in an uncommitted local `.env`, then run `npm run setup:admin`. Bookmark the private URL printed by the command.
6. Back up the Neon database and review monitoring, rate limits, data retention, product prices, service details, and public copy before launch.

Session cookies are HttpOnly, SameSite=Strict and Secure in production, with eight-hour expiry. Passwords use salted scrypt hashes; session tokens are stored as hashes. Admin mutations require authentication, an exact permitted Origin and a session CSRF token. SQL uses bound parameters. This is a tested baseline, not a security guarantee; production still needs infrastructure security, backups, monitoring and data-retention choices.

## Verification

```sh
npm test
```

The original frontend sources are retained in `src-before-refresh/` for comparison.

## Image assets

`public/images/snackle-juices.png`: generated concept product photography of mango, hibiscus and pineapple juice bottles, with cream labels and fruit, isolated on transparency.

`public/images/snackle-bites.png`: generated concept photography of a sharing platter of samosas, spring rolls, sausage rolls and puff-puff, isolated on transparency.

Generated with the built-in imagegen tool. These are visual concepts, not verified photos of the actual products or packaging.
