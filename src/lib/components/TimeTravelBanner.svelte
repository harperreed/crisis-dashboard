<!-- ABOUTME: Sticky banner displayed when viewing historical treasury data -->
<!-- ABOUTME: Shows selected date with "Return to Today" button to clear historical view -->
<script>
  import { selectedDate, clearHistoricalView } from '../stores/historyStore.js';

  /**
   * Format ISO date string to readable format (e.g., "December 11, 2025")
   * @param {string} isoDate - ISO date string (YYYY-MM-DD)
   * @returns {string} Formatted date string
   */
  function formatDate(isoDate) {
    if (!isoDate) return '';

    const date = new Date(isoDate + 'T12:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Handle "Return to Today" button click
   * Clears historical view and navigates to root
   */
  function handleReturnToToday() {
    clearHistoricalView();
    window.location.hash = '#/';
  }
</script>

{#if $selectedDate}
  <div class="sticky top-0 z-50 w-full bg-gradient-to-r from-navy-dark to-navy-primary border-b-2 border-gold shadow-lg">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-4 text-white">
        <div class="flex items-center gap-3">
          <span class="text-xl">📅</span>
          <span class="font-semibold">
            Viewing treasury as of {formatDate($selectedDate)}
          </span>
        </div>

        <button
          on:click={handleReturnToToday}
          class="btn-return-today"
          aria-label="Return to current treasury view"
        >
          Return to Today
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .btn-return-today {
    padding: 0.5rem 1.25rem;
    border-radius: 0.5rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.01em;
  }

  .btn-return-today:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: var(--gold-primary);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(201, 169, 97, 0.5);
    transform: translateY(-1px);
  }

  .btn-return-today:active {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.2);
  }

  /* Ensure CSS variables are accessible */
  :global(:root) {
    --navy-primary: #1E3A8A;
    --navy-dark: #0F2557;
    --gold-primary: #C9A961;
  }
</style>
