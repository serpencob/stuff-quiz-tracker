import { useEffect, useMemo, useState } from "react";
import { dataService } from "../lib/dataService";
import { computeTotals } from "../lib/stats";
import type { Person, QuizEntry } from "../types";

export function HomePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [entries, setEntries] = useState<QuizEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const [loadedPeople, loadedEntries] = await Promise.all([dataService.listPeople(), dataService.listEntries()]);
        setPeople(loadedPeople);
        setEntries(loadedEntries);
      } catch (loadError) {
        setError(`Failed to load dashboard: ${String(loadError)}`);
      }
    }

    void load();
  }, []);

  const totals = useMemo(() => computeTotals(entries), [entries]);

  return (
    <section>
      <h2>Dashboard</h2>
      <p>High-level view across everyone.</p>
      {error && <p className="error">{error}</p>}
      <div className="card stats-grid">
        <div>
          <strong>People</strong>
          <p>{people.length}</p>
        </div>
        <div>
          <strong>Entries</strong>
          <p>{entries.length}</p>
        </div>
        <div>
          <strong>Total attempts</strong>
          <p>{totals.attempts}</p>
        </div>
        <div>
          <strong>Accuracy</strong>
          <p>{totals.accuracy.toFixed(1)}%</p>
        </div>
      </div>
    </section>
  );
}
