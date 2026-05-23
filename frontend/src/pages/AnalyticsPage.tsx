import { FormEvent, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../lib/AppDataContext";
import { filterEntriesByRange, toSessionSeries } from "../lib/stats";

const DATE_FILTERS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" }
] as const;

function AnalyticsSkeleton() {
  return (
    <section>
      <h2>Analytics</h2>
      <div className="card skeleton-card">
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-row" />
      </div>
      <div className="card skeleton-card">
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-block" />
      </div>
    </section>
  );
}

export function AnalyticsPage() {
  const { people, entries, isLoading, error: loadError, clearError, addPerson } = useAppData();
  const [name, setName] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRange, setSelectedRange] = useState<(typeof DATE_FILTERS)[number]["value"]>("30");
  const [pageError, setPageError] = useState("");
  const displayedError = pageError || loadError;

  async function onAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setPageError("Name is required.");
      return;
    }
    try {
      setPageError("");
      clearError();
      await addPerson(trimmed);
      setName("");
    } catch (createError) {
      setPageError(`Failed to add person: ${String(createError)}`);
    }
  }

  const scopedEntries = useMemo(() => {
    const forPerson = selectedPersonId ? entries.filter((entry) => entry.person_id === selectedPersonId) : entries;
    const range = selectedRange === "all" ? "all" : Number(selectedRange);
    return filterEntriesByRange(forPerson, range);
  }, [entries, selectedPersonId, selectedRange]);

  const sessionSeries = useMemo(() => toSessionSeries(scopedEntries), [scopedEntries]);

  if (isLoading) return <AnalyticsSkeleton />;

  return (
    <section>
      <h2>Analytics</h2>
      <p>Manage people and view correct vs incorrect by quiz session.</p>
      {displayedError && <p className="error">{displayedError}</p>}

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
        <h3>Correct vs incorrect by session</h3>
        {sessionSeries.length === 0 ? (
          <p className="muted">No entries in this range.</p>
        ) : (
          <div className="chart-wrap chart-wrap-tall">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={sessionSeries} margin={{ bottom: 48, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
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
