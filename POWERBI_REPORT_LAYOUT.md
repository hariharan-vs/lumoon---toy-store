# LUMOON Power BI Report Layout

Data source: streaming dataset `Lumoon Orders` (one row per order line item).
Fields: timestamp, orderId, customerEmail, region, channel, product, collection, qty, revenue, pointsEarned.

The deck's goals this report tracks: +35% sales, 10 new markets, 3 collections, loyalty growth, 90% CSAT.

---

## 0. Setup

**Theme (match the website):** Page background `#FAF7F2`, card background `#FFFFFF`, text `#2B2540`, muted text `#6F6A85`, primary accent `#7B5CD6`, soft accent `#ECE6FB`.
Visual palette for categories (3 collections / channels): `#7B5CD6`, `#E58CB5`, `#4FB0A5`, `#F2B84B`.
Font: Segoe UI. Canvas: 16:9 (1280 x 720). Page title bar: "LUMOON | A Hug That Stays." in `#2B2540`, 20 pt bold.

**Two ways to use the data (use both):**
1. **Live dashboard tiles** (Power BI Service): Add a tile → Custom streaming data. These update instantly but support only simple charts (card, line, bar, gauge).
2. **Report** (richer visuals, slicers, DAX): Because Historic data analysis is ON, the dataset can be used in a report. Build it in Power BI Desktop via **Get data → Power BI datasets** (live connection), or in the Service via **Create → Pick a published dataset**. Publish, then **pin visuals to a dashboard** and enable **automatic page refresh** (Desktop: Format page → Page refresh → 1 second to 30 seconds, depending on your capacity/admin limits).

---

## 1. DAX measures

Create these as report-level measures (a live connection allows report-level measures; if your tenant blocks it, use the field aggregations noted in brackets).

```DAX
Total Revenue = SUM('Lumoon Orders'[revenue])

Total Orders = DISTINCTCOUNT('Lumoon Orders'[orderId])
-- A single order has several rows, so always count distinct order IDs.

Units Sold = SUM('Lumoon Orders'[qty])

Avg Order Value = DIVIDE([Total Revenue], [Total Orders])

Active Customers = DISTINCTCOUNT('Lumoon Orders'[customerEmail])

Markets Active = DISTINCTCOUNT('Lumoon Orders'[region])

Markets Target = 10

Loyalty Points Issued = SUM('Lumoon Orders'[pointsEarned])
-- Caution: pointsEarned repeats on every line of an order. For exact totals use:
Loyalty Points Issued (exact) =
SUMX(
    VALUES('Lumoon Orders'[orderId]),
    CALCULATE(MAX('Lumoon Orders'[pointsEarned]))
)

Revenue Today =
CALCULATE([Total Revenue], FILTER('Lumoon Orders', DATEVALUE('Lumoon Orders'[timestamp]) = TODAY()))

Revenue Last 7 Days =
CALCULATE([Total Revenue], FILTER('Lumoon Orders', 'Lumoon Orders'[timestamp] >= NOW() - 7))

Revenue Prior 7 Days =
CALCULATE(
    [Total Revenue],
    FILTER('Lumoon Orders',
        'Lumoon Orders'[timestamp] >= NOW() - 14 && 'Lumoon Orders'[timestamp] < NOW() - 7)
)

Sales Growth % = DIVIDE([Revenue Last 7 Days] - [Revenue Prior 7 Days], [Revenue Prior 7 Days])

Sales Growth Target = 0.35

Limited Edition Share =
DIVIDE(
    CALCULATE([Total Revenue], 'Lumoon Orders'[collection] IN {"Seasonal Limited", "Collaboration"}),
    [Total Revenue]
)

Repeat Customers =
COUNTROWS(FILTER(VALUES('Lumoon Orders'[customerEmail]),
    CALCULATE(DISTINCTCOUNT('Lumoon Orders'[orderId])) > 1))

Repeat Customer Rate = DIVIDE([Repeat Customers], [Active Customers])
```

If measures are unavailable: use the field wells with **Sum of revenue** and **Count (Distinct) of orderId**.

---

## 2. Page 1: Executive Overview (the "are we hitting the deck's targets?" page)

```
+--------------------------------------------------------------------------+
| LUMOON | Executive Overview                    [Date slicer: Between]    |
+------------+------------+------------+------------+----------------------+
| Revenue    | Orders     | Avg Order  | Active     | Markets Active       |
| (card)     | (card)     | Value      | Customers  | vs Target 10 (gauge) |
+------------+------------+------------+------------+----------------------+
| Revenue over time (line, by minute/hour/day)   | Sales Growth %          |
| X: timestamp  Y: Total Revenue                 | (gauge, target 35%)     |
+------------------------------------------------+-------------------------+
| Revenue by collection (donut)  | Revenue by channel (clustered bar)     |
+--------------------------------+----------------------------------------+
```

| Visual | Type | Fields | Notes |
|---|---|---|---|
| Revenue | Card | Total Revenue | Format ₹ with thousands separator; add a sparkline if on Desktop |
| Orders | Card | Total Orders | |
| Avg Order Value | Card | Avg Order Value | |
| Active Customers | Card | Active Customers | |
| Markets | Gauge | Value: Markets Active, Target: Markets Target, Max 10 | Deck goal: 10 new markets |
| Revenue over time | Line chart | Axis: timestamp (continuous); Values: Total Revenue | Use hierarchy drill: Day → Hour → Minute |
| Growth | Gauge | Value: Sales Growth %, Target: Sales Growth Target | Deck goal: +35% |
| Collections | Donut | Legend: collection; Values: Total Revenue | Core / Seasonal Limited / Collaboration |
| Channels | Clustered bar | Axis: channel; Values: Total Revenue | Official Site, Marketplace, Pop-up, Gift Shop |

Slicers: date range (timestamp), region (dropdown).

---

## 3. Page 2: Markets and Expansion

Purpose: track the "10 new markets" goal and see which regions respond to launches.

| Visual | Type | Fields |
|---|---|---|
| Revenue by region | Filled map or Map | Location: region; Size: Total Revenue |
| Region leaderboard | Bar chart (sorted desc) | Axis: region; Values: Total Revenue |
| Region x Collection | Matrix | Rows: region; Columns: collection; Values: Total Revenue (conditional formatting: color scale `#ECE6FB` → `#7B5CD6`) |
| New markets timeline | Line chart | Axis: timestamp; Values: Markets Active (running count) |
| Orders by region | Table | region, Total Orders, Units Sold, Avg Order Value |

Slicers: channel, collection.

---

## 4. Page 3: Products and Collections

Purpose: decide which characters to restock, retire or bundle; evaluate the 3-collection plan.

| Visual | Type | Fields |
|---|---|---|
| Top characters | Bar chart (Top N = 6) | Axis: product; Values: Units Sold |
| Revenue by collection over time | Stacked area | Axis: timestamp; Legend: collection; Values: Total Revenue |
| Limited edition share | Card or 100% stacked bar | Limited Edition Share |
| Product performance | Table | product, collection, Units Sold, Total Revenue, Avg Order Value (data bars on revenue) |
| Price vs volume | Scatter | X: Avg Order Value; Y: Units Sold; Details: product; Legend: collection |

Slicers: collection, region.

---

## 5. Page 4: Customers and Loyalty

Purpose: track the "5K loyalty members" and repeat-purchase goals.

| Visual | Type | Fields |
|---|---|---|
| Active customers | Card | Active Customers |
| Repeat customer rate | Gauge or Card | Repeat Customer Rate |
| Loyalty points issued | Card | Loyalty Points Issued (exact) |
| Customers over time | Line chart | Axis: timestamp (date); Values: Active Customers |
| Top customers | Table (Top N = 10) | customerEmail, Total Orders, Total Revenue, Loyalty Points Issued (exact) |
| Order frequency | Column chart | Axis: orders per customer bucket (1, 2, 3+) |

Privacy note: `customerEmail` is personal data. For a shared dashboard, mask or hash it in the backend (`powerbi.js`) before pushing, and show only a customer count.

---

## 6. Page 5: Live Operations (wall-display / big-screen view)

Use this page on a TV or second monitor, with page refresh set to the shortest allowed interval.

```
+-------------------------------+-------------------------------+
| Revenue Today (huge card)     | Orders (last hour) (huge card)|
+-------------------------------+-------------------------------+
| Revenue per minute (line, last 60 min)                        |
+---------------------------------------+-----------------------+
| Latest orders (table, top 10 by time) | Revenue by region     |
+---------------------------------------+-----------------------+
```

Latest orders table: timestamp, region, product, qty, revenue, sorted by timestamp descending, Top N = 10. Set the visual filter to relative time: **last 1 hour**.

---

## 7. Streaming dashboard tiles (Service)

On the Power BI Service dashboard (New → Dashboard → Add a tile → Custom streaming data → `Lumoon Orders`), add:

1. **Card:** `revenue` (sum), the running sales total
2. **Line chart:** `timestamp` (axis) + `revenue` (values), time window 5 minutes
3. **Bar chart:** `region` + `revenue`
4. **Donut/bar:** `collection` + `qty`
5. **Card:** `qty` (sum), units sold

Streaming tiles cannot use DAX or distinct count, so keep order counts on the report pages instead.

---

## 8. Known limitations and next steps

- **CSAT (90% target) is not in this dataset.** Feedback is stored in MongoDB and shown on the website's Admin tab. To show it in Power BI, create a second streaming dataset `Lumoon Feedback` (timestamp, customerEmail, rating) and push from `POST /api/feedback`. Then add a gauge: `% of ratings >= 4` with target 90%.
- **Loyalty member count** needs a customers dataset (new signups). Same pattern: `Lumoon Customers` (timestamp, email, region, tier).
- **Retention of history:** streaming datasets keep a limited number of rows (about 200k). For long-term trends, schedule an import from MongoDB (via MongoDB Atlas SQL interface/ODBC connector or an export job) into a separate dataset.
- **Duplicates:** the backend pushes once per order. If you replay or re-seed data, rows are appended again, so avoid re-pushing and use Total Orders (distinct) for counts.
- **Refresh rates:** automatic page refresh intervals are limited by your Power BI capacity and admin settings; college or work tenants often enforce a minimum of 30 seconds to 5 minutes.
