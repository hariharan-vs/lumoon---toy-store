# LUMOON: Live Sales Pipeline (Website → MongoDB → Power BI)

```
React site ──► Express API ──► MongoDB   (system of record)
                   │
                   └──► Power BI streaming dataset (push URL) ──► live dashboard
```

Every order placed on the site is saved to MongoDB and pushed to Power BI within a second.

## 1. Prerequisites
- Node.js 18+
- MongoDB (local, or a free Atlas cluster)
- Power BI Pro / work or college account (app.powerbi.com)

## 2. Run the backend
```bash
cd server
npm install
cp .env.example .env     # set MONGO_URI (and POWERBI_PUSH_URL later)
npm run seed             # loads 6 Lumoon plush products
npm start                # http://localhost:5000
```

## 3. Run the website
```bash
cd client
npm install
npm run dev              # http://localhost:5173
```
Tabs: **Shop** (storefront), **My Rewards** (customer dashboard, enter the email used at checkout), **Admin** (live stats).

## 4. Create the Power BI streaming dataset
1. Go to app.powerbi.com → your workspace → **New** → **Streaming dataset** → **API** → Next.
2. Name it `Lumoon Orders`. Add these fields exactly:

| Field | Type |
|---|---|
| timestamp | DateTime |
| orderId | Text |
| customerEmail | Text |
| region | Text |
| channel | Text |
| product | Text |
| collection | Text |
| qty | Number |
| revenue | Number |
| pointsEarned | Number |

3. Turn **Historic data analysis** ON (needed to build full reports, not only live tiles). Click **Create**.
4. Copy the **Push URL** into `server/.env` as `POWERBI_PUSH_URL=...`, then restart the server.

## 5. Build the live dashboard
1. In the workspace, **New** → **Dashboard** → **Add a tile** → **Custom streaming data** → choose `Lumoon Orders`.
2. Suggested tiles:
   - **Card**: sum of `revenue` (total sales)
   - **Line chart**: `timestamp` vs `revenue`
   - **Bar chart**: `region` vs `revenue` (the 10-market expansion goal)
   - **Donut**: `collection` vs `qty` (Core / Seasonal / Collaboration)
   - **Bar**: `channel` vs `revenue`
3. For richer visuals (slicers, DAX measures), create a **Report** from the dataset (works because Historic data is ON) and pin visuals to the dashboard.

## 6. Generate live traffic for a demo
With the API running:
```bash
cd server
npm run simulate         # new fake order every 3 seconds
```
Place a real order on the site too. It appears on the Power BI tiles within seconds.

## Notes
- Power BI has no native live connector for MongoDB. The push-dataset approach avoids refresh schedules.
- Streaming datasets store a limited history (about 200k rows). For long-term analysis, add a scheduled import from MongoDB later.
- Payments, authentication and email verification are intentionally mocked; add them before real use.
- Metrics mapped from the deck: sales growth (revenue), 10 new markets (region), collections (collection), 90% CSAT (feedback ratings, shown on Admin tab), loyalty (points and tiers).
