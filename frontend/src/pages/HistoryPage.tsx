import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dataService } from "../lib/dataService";
import { computeTotals, filterEntriesByRange, toDailySeries } from "../lib/stats";
import type { Person, QuizEntry } from "../types";

const DATE_FILTERS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" }
] as const;

export function HistoryPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [entries, setEntries] = useState<QuizEntry[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRange, setSelectedRange] = useState<(typeof DATE_FILTERS)[number]["value"]>("30");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");
      const [loadedPeople, loadedEntries] = await Promise.all([dataService.listPeople(), dataService.listEntries()]);
      setPeople(loadedPeople);
      setEntries(loadedEntries);
      if (loadedPeople.length > 0 && !selectedPersonId) {
        setSelectedPersonId(loadedPeople[0].id);
      }
    } catch (loadError) {
      setError(`Failed to load history: ${String(loadError)}`);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPersonId) {
      setError("Select a person first.");
      return;
    }
    if (correctCount < 0 || incorrectCount < 0) {
      setError("Counts must be non-negative.");
      return;
    }

    try {
      setError("");
      await dataService.createEntry({
        personId: selectedPersonId,
        entryDate,
        correctCount,
        incorrectCount,
        note
      });
      setCorrectCount(0);
      setIncorrectCount(0);
      setNote("");
      await loadData();
    } catch (createError) {
      setError(`Failed to create entry: ${String(createError)}`);
    }
  }

  const scopedEntries = useMemo(() => {
    const forPerson = selectedPersonId ? entries.filter((entry) => entry.person_id === selectedPersonId) : entries;
    const range = selectedRange === "all" ? "all" : Number(selectedRange);
    return filterEntriesByRange(forPerson, range);
  }, [entries, selectedPersonId, selectedRange]);

  const totals = useMemo(() => computeTotals(scopedEntries), [scopedEntries]);
  const dailySeries = useMemo(() => toDailySeries(scopedEntries), [scopedEntries]);

  function personName(personId: string) {
    return people.find((person) => person.id === personId)?.name ?? "Unknown";
  }

  return (
    <section>
      <h2>History</h2>
      <p>Record quiz sessions and review trends over time.</p>
      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          Person
          <select value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
        </label>
        <label>
          Correct
          <input
            type="number"
            min={0}
            value={correctCount}
            onChange={(event) => setCorrectCount(Number(event.target.value))}
          />
        </label>
        <label>
          Incorrect
          <input
            type="number"
            min={0}
            value={incorrectCount}
            onChange={(event) => setIncorrectCount(Number(event.target.value))}
          />
        </label>
        <label className="full-width">
          Note
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note/topic" />
        </label>
        <button type="submit">Save entry</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="card controls-row">
        <label>
          Person filter
          <select value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date range
          <select value={selectedRange} onChange={(event) => setSelectedRange(event.target.value as (typeof DATE_FILTERS)[number]["value"])}>
            {DATE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card stats-grid">
        <div>
          <strong>Total correct</strong>
          <p>{totals.correct}</p>
        </div>
        <div>
          <strong>Total incorrect</strong>
          <p>{totals.incorrect}</p>
        </div>
        <div>
          <strong>Attempts</strong>
          <p>{totals.attempts}</p>
        </div>
        <div>
          <strong>Accuracy</strong>
          <p>{totals.accuracy.toFixed(1)}%</p>
        </div>
      </div>

      <div className="card">
        <h3>Accuracy trend</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line dataKey="accuracy" stroke="#2563eb" type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Daily correct vs incorrect</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="correct" fill="#16a34a" />
              <Bar dataKey="incorrect" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Recent entries</h3>
        {scopedEntries.length === 0 ? (
          <p>No entries in this filter yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Person</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {scopedEntries.slice(0, 20).map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.entry_date}</td>
                  <td>{personName(entry.person_id)}</td>
                  <td>{entry.correct_count}</td>
                  <td>{entry.incorrect_count}</td>
                  <td>{entry.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
