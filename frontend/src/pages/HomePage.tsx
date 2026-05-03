import { FormEvent, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dataService } from "../lib/dataService";
import { groupSessionsToChartSeries } from "../lib/stats";
import type { GroupQuizSession, Person } from "../types";

function todayLocalDate() {
  return new Date().toISOString().slice(0, 10);
}

type ScoreStrings = { correct: string; incorrect: string };

export function HomePage() {
  const [sessions, setSessions] = useState<GroupQuizSession[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [groupCorrectInput, setGroupCorrectInput] = useState("");
  const [personScores, setPersonScores] = useState<Record<string, ScoreStrings>>({});
  const [error, setError] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);

  async function loadSessions() {
    const list = await dataService.listGroupQuizSessions();
    setSessions(list);
  }

  async function loadPeople() {
    const list = await dataService.listPeople();
    setPeople(list);
  }

  async function loadAll() {
    try {
      setError("");
      await Promise.all([loadSessions(), loadPeople()]);
    } catch (e) {
      setError(`Failed to load dashboard: ${String(e)}`);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    setPersonScores((prev) => {
      const next = { ...prev };
      for (const p of people) {
        if (!(p.id in next)) next[p.id] = { correct: "", incorrect: "" };
      }
      return next;
    });
  }, [people]);

  const chartSeries = useMemo(() => groupSessionsToChartSeries(sessions), [sessions]);

  async function onSubmitGroup(event: FormEvent) {
    event.preventDefault();
    try {
      setSavingGroup(true);
      setError("");
      const c = Math.round(Number(groupCorrectInput));
      if (!Number.isFinite(c) || !Number.isInteger(c) || c < 0 || c > 15) {
        setError("Enter a whole number from 0 to 15 for the group quiz.");
        return;
      }
      await dataService.appendGroupQuizSession({ correctCount: c, quizDate: todayLocalDate() });
      setGroupCorrectInput("");
      await loadSessions();
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingGroup(false);
    }
  }

  function parseNonNegativeInt(raw: string): number {
    const n = Math.round(Number(raw.trim()));
    return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : NaN;
  }

  async function onSubmitBatch(event: FormEvent) {
    event.preventDefault();
    try {
      setSavingBatch(true);
      setError("");
      const rows = people.map((p) => {
        const s = personScores[p.id] ?? { correct: "", incorrect: "" };
        return {
          personId: p.id,
          correctCount: parseNonNegativeInt(s.correct),
          incorrectCount: parseNonNegativeInt(s.incorrect)
        };
      });
      if (rows.some((r) => Number.isNaN(r.correctCount) || Number.isNaN(r.incorrectCount))) {
        setError("Use whole numbers ≥ 0 for correct and incorrect counts.");
        return;
      }
      const anyData = rows.some((r) => r.correctCount > 0 || r.incorrectCount > 0);
      if (!anyData) {
        setError("Enter at least one non-zero correct or incorrect count before submitting.");
        return;
      }
      await dataService.submitPersonEntries({ entryDate: todayLocalDate(), rows });
      const clearedAfterSubmit: Record<string, ScoreStrings> = {};
      for (const p of people) {
        clearedAfterSubmit[p.id] = { correct: "", incorrect: "" };
      }
      setPersonScores(clearedAfterSubmit);
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingBatch(false);
    }
  }

  function resetBatchForm() {
    const cleared: Record<string, ScoreStrings> = {};
    for (const p of people) {
      cleared[p.id] = { correct: "", incorrect: "" };
    }
    setPersonScores(cleared);
  }

  return (
    <section className="dashboard-section">
      <h2>Dashboard</h2>
      <p>Group quiz trend (max 15 correct per session) and quick logging. Sessions use today&apos;s date automatically.</p>
      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <div className="card">
          <h3>Group quiz — correct per session</h3>
          <div className="chart-wrap chart-wrap-tall">
            {chartSeries.length === 0 ? (
              <p className="muted">No group sessions yet. Add one with the form.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartSeries} margin={{ bottom: 48, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 15]} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="correct" name="Correct" stroke="#2563eb" type="monotone" dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <form className="form-inline mt-1" onSubmit={onSubmitGroup}>
            <label>
              Correct (0–15)
              <input
                type="number"
                min={0}
                max={15}
                step={1}
                placeholder="0–15"
                value={groupCorrectInput}
                onChange={(e) => setGroupCorrectInput(e.target.value)}
              />
            </label>
            <button type="submit" disabled={savingGroup}>
              record group quiz
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Individual session (submit once)</h3>
          <p className="muted small">
            Adjust counts for each person, then submit. Entries use today&apos;s date. Nothing is saved until you submit.
          </p>
          {people.length === 0 ? (
            <p className="muted">Add people on the Analytics page first.</p>
          ) : (
            <form className="person-batch-form" onSubmit={onSubmitBatch}>
              <ul className="person-batch-list">
                {people.map((p) => {
                  const s = personScores[p.id] ?? { correct: "", incorrect: "" };
                  return (
                    <li key={p.id} className="person-batch-row">
                      <span className="person-name">{p.name}</span>
                      <label>
                        Correct
                        <input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0"
                          value={s.correct}
                          onChange={(e) =>
                            setPersonScores((prev) => ({
                              ...prev,
                              [p.id]: { ...s, correct: e.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        Incorrect
                        <input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0"
                          value={s.incorrect}
                          onChange={(e) =>
                            setPersonScores((prev) => ({
                              ...prev,
                              [p.id]: { ...s, incorrect: e.target.value }
                            }))
                          }
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetBatchForm}>
                  Reset form
                </button>
                <button type="submit" disabled={savingBatch}>
                  Submit session
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
