import { FormEvent, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dataService } from "../lib/dataService";
import { filterEntriesByRange, toDailySeries } from "../lib/stats";
import type { Person, QuizEntry } from "../types";

const DATE_FILTERS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" }
] as const;

export function AnalyticsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [entries, setEntries] = useState<QuizEntry[]>([]);
  const [name, setName] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRange, setSelectedRange] = useState<(typeof DATE_FILTERS)[number]["value"]>("30");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    try {
      setError("");
      const [loadedPeople, loadedEntries] = await Promise.all([dataService.listPeople(), dataService.listEntries()]);
      setPeople(loadedPeople);
      setEntries(loadedEntries);
    } catch (loadError) {
      setError(`Failed to load data: ${String(loadError)}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    try {
      setError("");
      await dataService.createPerson(trimmed);
      setName("");
      await loadData();
    } catch (createError) {
      setError(`Failed to add person: ${String(createError)}`);
    }
  }

  const scopedEntries = useMemo(() => {
    const forPerson = selectedPersonId ? entries.filter((entry) => entry.person_id === selectedPersonId) : entries;
    const range = selectedRange === "all" ? "all" : Number(selectedRange);
    return filterEntriesByRange(forPerson, range);
  }, [entries, selectedPersonId, selectedRange]);

  const dailySeries = useMemo(() => toDailySeries(scopedEntries), [scopedEntries]);

  return (
    <section>
      <h2>Analytics</h2>
      <p>Manage people and view combined correct vs incorrect by day.</p>
      {error && <p className="error">{error}</p>}

      <form className="card form-grid" onSubmit={onAddPerson}>
        <h3>Add person</h3>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alice" />
        </label>
        <button type="submit">Add person</button>
      </form>

      <div className="card controls-row">
        <label>
          Person
          <select value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)}>
            <option value="">All people</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date range
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value as (typeof DATE_FILTERS)[number]["value"])}
          >
            {DATE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <h3>Correct vs incorrect by day</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : dailySeries.length === 0 ? (
          <p className="muted">No entries in this range.</p>
        ) : (
          <div className="chart-wrap chart-wrap-tall">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="correct" name="Correct" stroke="#16a34a" type="monotone" dot />
                <Line dataKey="incorrect" name="Incorrect" stroke="#dc2626" type="monotone" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
