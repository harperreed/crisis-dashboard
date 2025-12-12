# Historical Treasury Timeline - Design

## Overview

Add a historical timeline feature that tracks treasury value over time and lets users view the full dashboard as it appeared on any past date.

## Requirements

- All-time history from implementation date forward (no backfilling)
- Line chart visualization with clickable dates
- Full dashboard recreation when viewing historical dates
- Dedicated `/history` route
- Git-based storage (JSON files committed by GitHub Action)

## Data Layer

### Storage Structure

```
public/data/
├── treasury-snapshot.json          # Current snapshot (existing)
└── history/
    ├── index.json                  # Timeline index with summary values
    ├── 2025-12-11.json
    ├── 2025-12-12.json
    └── ...
```

Each historical file uses the same schema as `treasury-snapshot.json`. This allows existing components to render historical data without modification.

### History Index

The `index.json` enables fast timeline rendering without loading every snapshot:

```json
{
  "dates": [
    { "date": "2025-12-11", "totalValue": 125430.50, "ethPrice": 3175.06 },
    { "date": "2025-12-12", "totalValue": 128200.00, "ethPrice": 3220.15 }
  ],
  "firstDate": "2025-12-11",
  "lastDate": "2025-12-12"
}
```

### GitHub Action Changes

Modify `daily-build.yml` to:

1. Copy today's snapshot to `history/YYYY-MM-DD.json`
2. Regenerate `history/index.json` with the new entry
3. Commit both files before deploy

## Routing

### URL Structure

- `/` or `/#/` → Current dashboard (unchanged)
- `/#/history` → Timeline view
- `/#/history/2025-12-11` → Dashboard showing that specific date

### Navigation

- Add "View History" button in Header component
- "Back to Today" button on history pages returns to current dashboard
- Clicking a chart data point navigates to that date's full view

## Timeline Visualization

### Chart Component

Chart.js line chart on the `/history` page:

- X-axis: dates (auto-scaled)
- Y-axis: total treasury value in USD
- Clickable data points load that date's snapshot
- Hover tooltips show date, value, and ETH price
- Time range buttons: 1M / 3M / 6M / 1Y / All

### Summary Stats

Display above the chart:

- Current Value
- All-Time High (with date)
- All-Time Low (with date)
- First Tracked date

## Historical Dashboard View

### Time-Travel Banner

Sticky banner when viewing historical data:

```
┌─────────────────────────────────────────────────────────────┐
│  📅 Viewing treasury as of December 11, 2025  ·  [Return to Today]  │
└─────────────────────────────────────────────────────────────┘
```

### Component Behavior

- **TreasuryTotal**: Renders from historical data
- **Breakdown**: Renders from historical data
- **Charts**: Renders from historical data
- **HoldersList**: Renders from historical data
- **UserHoldings**: Hidden (personal holdings only relevant for today)
- **WalletConnect**: Disabled on historical views

### Data Flow

```
User clicks date on timeline
        ↓
Fetch /data/history/YYYY-MM-DD.json
        ↓
Load into store or pass as props
        ↓
Components render historical data
        ↓
Banner indicates viewing date
```

## Edge Cases

- **Missing date**: Display "No data available for this date"
- **First load of history page**: Show timeline chart, no date selected
- **Direct URL to historical date**: Works as shareable link

## Storage Projections

- ~5KB per daily snapshot
- ~1.8MB per year
- Git handles this scale indefinitely

## Files to Create/Modify

### New Files

- `src/routes/History.svelte` - Timeline page component
- `src/routes/HistoricalDashboard.svelte` - Historical dashboard wrapper
- `src/components/TimelineChart.svelte` - Line chart component
- `src/components/TimeTravelBanner.svelte` - Historical view banner
- `src/lib/stores/historyStore.js` - History data management
- `public/data/history/index.json` - Initial empty index

### Modified Files

- `src/App.svelte` - Add hash-based routing
- `src/components/Header.svelte` - Add "View History" navigation
- `.github/workflows/daily-build.yml` - Add history snapshot logic
- `scripts/fetch-treasury-data.js` - Add history file generation
