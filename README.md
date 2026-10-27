# Snackle

React + Vite storefront with a Node.js/SQLite backend. Keeps Snackle's orange, cocoa, cream and teal branding and full-screen stacking sections. Crumbl informed the clear menu/catering paths; no Crumbl assets are used.

## Local preview

Requires Node.js 22.13 or newer.

```sh
npm install
npm run api
```

In a second terminal:

```sh
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` and `/media` to the backend.

## Activate the single owner

```sh
npm run setup:admin
```

The interactive prompt sets a hidden password for **cindyafidoku0@gmail.com**. Use at least 14 characters. No password is seeded, printed, checked into source or sent in chat. Sign in at `/#/admin`. There is no public signup or first-visitor account claiming. The database constrains the owner table to one account.

For a forgotten password, run `npm run setup:admin -- --reset-password` on the server. This revokes existing sessions.

## Owner tools

- Orders & bookings: review contact details, preferred date, requests and notes; update internal status. Contact customers separately: no automated emails or WhatsApp messages are sent.
- Menu & pricing: set actual price, bottle/portion size, and availability. Empty prices mean quote requests. Currency defaults to **GHS provisionally** and is configured with the `CURRENCY` environment variable.
- Website editor: edit copy, colours and full-screen sections. Add up to 12 images per carousel, upload PNG/JPEG/WebP files (6 MB each), reorder/remove images, or use HTTPS image URLs. Uploaded images are stored in SQLite. Publish changes to make the section configuration visible to visitors. Clear backgrounds look best for rotating product cutouts.
- Carousels rotate every five seconds while visible. Hover or keyboard focus pauses motion; manual arrows/swipes pause autoplay until Play is selected. Reduced-motion preferences disable autoplay and transitions. Arrow keys work when the carousel is focused. Single-image carousels disable rotation controls.

## Customer behaviour

- Browse and filter bites and drinks; maintain a device-local basket with product IDs and quantities only.
- Submit pickup/delivery order requests and event enquiries. No payment is collected and no date is automatically reserved.
- Submitted records are stored on the server. Prices, availability and totals are resolved from the server catalog, ignoring client-supplied prices. Delivery charges and final totals require owner confirmation.
- Requests remain pending until the owner confirms availability and pricing directly with the customer.

## Production deployment

This is a Node service, **not a static-only deployment**. It has not been published to a public host.

1. Set real menu prices/portion sizes and currency; review public contact details and copy.
2. Replace generated concept imagery and existing product illustrations with actual product photos if required.
3. Place the service behind HTTPS with a reverse proxy. Set `NODE_ENV=production`, `APP_ORIGIN=https://your-domain`, `PORT=3001`, and `DATABASE_PATH` to durable storage. Production refuses to start without an HTTPS origin.
4. Run `npm run build`, then `npm start`. The Node service serves the built UI, API and uploaded images. It binds to loopback for a same-machine reverse proxy.
5. Configure the owner password on that deployment. Do not deploy a test database. Back up the SQLite database, including uploads and customer requests; use restricted filesystem permissions and a consistent SQLite backup procedure.
6. Add edge-level rate limiting for internet traffic. In-process limits are a basic safeguard and use the direct socket IP; behind a reverse proxy they are shared across visitors and reset on restart.

Session cookies are HttpOnly, SameSite=Strict and Secure in production, with eight-hour expiry. Passwords use salted scrypt hashes; session tokens are stored as hashes. Admin mutations require authentication, an exact permitted Origin and a session CSRF token. Public requests are validated and rate limited. SQL uses bound parameters. PNG/JPEG/WebP uploads are size- and signature-checked; SVG/HTML uploads are rejected. Production sets a CSP, HSTS, frame denial and nosniff headers. This is tested baseline protection, not a guarantee against all threats. Public deployment should include TLS, infrastructure security, backups, monitoring and data-retention choices.

## Verification

```sh
npm run build
npm test
npm run test:browser
```

Browser tests use Playwright with installed Google Chrome on macOS; set `CHROME_PATH` for another executable or install Playwright Chromium and omit the executable override. Both backend and browser tests use an isolated in-memory database and synthetic data. Screenshots go to `qa/`.

The original frontend sources are retained in `src-before-refresh/` for comparison.

## Image assets

`public/images/snackle-juices.png`: generated concept product photography of mango, hibiscus and pineapple juice bottles, with cream labels and fruit, isolated on transparency.

`public/images/snackle-bites.png`: generated concept photography of a sharing platter of samosas, spring rolls, sausage rolls and puff-puff, isolated on transparency.

Generated with the built-in imagegen tool. These are visual concepts, not verified photos of the actual products or packaging.
