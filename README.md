# PrimeBid: MERN Auction Platform

Auctioneers list items with a start and end time, bidders compete in real time, and the
highest bidder wins when the auction closes. The platform charges auctioneers a commission
(5% by default). Auctioneers pay it by uploading a payment screenshot, which a Super Admin
reviews from the dashboard.

| Layer    | Tech                                                         |
| -------- | ------------------------------------------------------------ |
| Frontend | React 18, Vite, Redux Toolkit, React Router, Tailwind CSS     |
| Backend  | Node.js, Express, Mongoose, JWT (httpOnly cookie), node-cron |
| Services | MongoDB, Cloudinary (images), SMTP (emails, optional)        |

```
backend/    Express API (also serves frontend/dist in production)
frontend/   React app
render.yaml One-click Render deployment (single service)
```

---

## Run it locally

### 1. Prerequisites
- **Node.js 20 or newer** (22 LTS recommended). Check with `node -v`.
  Node 18 still runs the dev setup, but it is end-of-life and some dependencies need 20+.
  Upgrade with `brew install node@22` or [nvm](https://github.com/nvm-sh/nvm).
- **MongoDB**: a local server (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas cluster.
- **Cloudinary account** (free). Required, because sign-up and auctions upload images.
- An SMTP account is optional. Without one the app works, but no emails are sent.

### 2. Install
```bash
npm run install:all
```

### 3. Configure the backend
```bash
cp backend/config/config.env.example backend/config/config.env
```
Edit `backend/config/config.env`. The minimum is:
```env
MONGO_URI=mongodb://127.0.0.1:27017
JWT_SECRET_KEY=<at least 32 random characters>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
Generate a secret with
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
`config.env` is git-ignored. Never commit it.

### 4. Create your admin account
Public sign-up only creates Bidders and Auctioneers. Create the Super Admin from the terminal:
```bash
npm run create-admin -- --name "Site Admin" --email admin@example.com --password 'a-strong-password'
```

### 5. (Only if reusing a database from the old version)
```bash
npm run migrate
```
This converts old text dates to real dates, moves Easypaisa details into the new wallet
field, lower-cases emails, and removes duplicate bid records. It is safe to run twice.

### 6. Start
```bash
npm run dev
```
Open **http://localhost:5173**. The API runs on http://localhost:4000, and Vite forwards
`/api` requests to it.

> **macOS note:** port 5000 is used by AirPlay Receiver, which is why the API uses 4000.
> To change it, set `PORT` in `config.env` and `VITE_DEV_API_PROXY` in `frontend/.env`.

### Try the full flow
1. Sign up as an **Auctioneer** and create an auction that starts in a minute or two.
2. In another browser (or a private window), sign up as a **Bidder** and place bids once it is live.
3. After it ends, a background job runs every minute. It picks the winner, emails both
   parties, and charges the auctioneer's commission.
4. As the auctioneer, open **Submit Commission** and upload a payment screenshot.
5. Log in as the admin, open **Dashboard > Payment Proofs > Review**, and approve it. The
   commission is settled at once and the auctioneer can post again.

---

## Deploy

The backend must run as a **long-lived Node server**, not a serverless function, because
the auction-closing job runs inside it.

### Option A (recommended): one service on Render
The API serves the built React app, so everything is on one domain and login cookies just work.

1. Push this repo to GitHub.
2. Create a **MongoDB Atlas** cluster. Under *Network Access*, allow `0.0.0.0/0` or Render's IPs.
3. In Render: **New > Blueprint**, pick the repo. `render.yaml` sets up the build
   (`npm run build`) and start (`npm start`) commands, and the health check.
4. Fill in the prompted secrets: `MONGO_URI`, the three `CLOUDINARY_*` values, and SMTP
   if you want email. `JWT_SECRET_KEY` is generated for you.
5. After the first deploy, create the admin from Render's **Shell** tab:
   `npm run create-admin -- --email you@example.com --password '...'`

On another host (Railway, Fly.io, a VPS): set the same environment variables plus
`NODE_ENV=production`, and use `npm run build` and then `npm start`.

### Option B: frontend and backend on separate hosts
- Deploy the backend as in Option A, with `SERVE_CLIENT=false`.
- Deploy `frontend/` to Vercel or Netlify. Replace `YOUR-BACKEND-HOST` in
  `frontend/vercel.json` (Vercel) or `frontend/public/_redirects` (Netlify) with your
  backend's hostname. The host then proxies `/api`, so cookies stay first-party.
- Set `FRONTEND_URL` on the backend to the frontend's URL.
- If you can't proxy and must call the API on a different domain, set `VITE_API_URL`
  on the frontend and `COOKIE_SAMESITE=none` on the backend. Safari may block these
  cross-site cookies, so prefer the proxy.

### Production checklist
- [ ] `NODE_ENV=production`, plus a long random `JWT_SECRET_KEY`.
- [ ] Fresh MongoDB and Cloudinary credentials (never reuse any that were committed to git).
- [ ] SMTP configured. Gmail needs an *App Password*.
- [ ] Admin created with `npm run create-admin`.
- [ ] The free Render plan sleeps when idle, and auctions only close while the server is
      awake. Use a paid instance for real use.

---

## Configuration reference
Every backend setting is documented in
[`backend/config/config.env.example`](backend/config/config.env.example). The main
optional ones are `COMMISSION_RATE` (default `0.05`), `APP_NAME` (used in emails),
`CONTACT_RECEIVER_EMAIL` (inbox for the contact form), and `ENABLE_CRON` (set to `false`
on extra instances).

## Useful scripts (run from the repo root)
| Command                        | What it does                                  |
| ------------------------------ | --------------------------------------------- |
| `npm run dev`                  | API + frontend with hot reload                |
| `npm run build`                | Install everything and build the frontend     |
| `npm start`                    | Start the production server                   |
| `npm run lint`                 | Lint the frontend                             |
| `npm run create-admin -- ...`  | Create or promote a Super Admin               |
| `npm run migrate`              | Upgrade data from the old version             |
