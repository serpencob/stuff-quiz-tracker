import { FormEvent, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData, type ScoreStrings } from "../lib/AppDataContext";
import { groupSessionsToChartSeries } from "../lib/stats";

function parseRequiredInt(raw: string, min: number, max: number) {
  if (raw.trim() === "") return NaN;
  const n = Number(raw.trim());
  return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
}

function parseOptionalNonNegativeInt(raw: string) {
  if (raw.trim() === "") return 0;
  const n = Number(raw.trim());
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

function LoadingDashboard() {
  return (
    <section className="dashboard-section">
      <h2>Dashboard</h2>
      <div className="card skeleton-card">
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-block" />
      </div>
      <div className="card skeleton-card">
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-line" />
        <span className="skeleton-row" />
        <span className="skeleton-row" />
      </div>
    </section>
  );
}

export function HomePage() {
  const {
    people,
    groupSessions,
    isLoading,
    error: loadError,
    clearError,
    submitQuizSession,
    quizFormDraft,
    setQuizFormDraft,
    resetQuizFormDraft
  } = useAppData();
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const chartSeries = useMemo(() => groupSessionsToChartSeries(groupSessions), [groupSessions]);
  const displayedError = formError || loadError;

  function updateGroupCorrect(value: string) {
    setQuizFormDraft((prev) => ({ ...prev, groupCorrect: value }));
  }

  function updatePersonScore(personId: string, field: keyof ScoreStrings, value: string) {
    setQuizFormDraft((prev) => {
      const current = prev.personScores[personId] ?? { correct: "", incorrect: "" };
      return {
        ...prev,
        personScores: {
          ...prev.personScores,
          [personId]: { ...current, [field]: value }
        }
      };
    });
  }

  async function onSubmitQuizSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSaving(true);
      setFormError("");
      clearError();

      const groupCorrectCount = parseRequiredInt(quizFormDraft.groupCorrect, 0, 15);
      if (Number.isNaN(groupCorrectCount)) {
        setFormError("Enter a whole number from 0 to 15 for the group quiz.");
        return;
      }

      const individualRows = people.map((person) => {
        const score = quizFormDraft.personScores[person.id] ?? { correct: "", incorrect: "" };
        return {
          personId: person.id,
          correctCount: parseOptionalNonNegativeInt(score.correct),
          incorrectCount: parseOptionalNonNegativeInt(score.incorrect)
        };
      });
      if (individualRows.some((row) => Number.isNaN(row.correctCount) || Number.isNaN(row.incorrectCount))) {
        setFormError("Use whole numbers >= 0 for individual correct and incorrect counts.");
        return;
      }

      await submitQuizSession({ groupCorrectCount, individualRows });
    } catch (submitError) {
      setFormError(`Failed to submit quiz session: ${String(submitError)}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingDashboard />;

  return (
    <section className="dashboard-section">
      <h2>Dashboard</h2>
      <p>Group quiz trend and quick logging. The overall score is required; individual scores are optional.</p>
      {displayedError && <p className="error">{displayedError}</p>}

      <div className="card">
        <h3>Group quiz - correct per session</h3>
        <div className="chart-wrap chart-wrap-tall">
          {chartSeries.length === 0 ? (
            <p className="muted">No group sessions yet. Add one with the form below.</p>
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
      </div>

      <form className="card quiz-session-form" onSubmit={onSubmitQuizSession}>
        <div>
          <h3>Submit quiz session</h3>
          <p className="muted small">
            Record the overall result, and optionally add correct and incorrect counts for each person.
          </p>
        </div>

        <label className="group-score-field">
          Overall correct (0-15)
          <input
            type="number"
            min={0}
            max={15}
            step={1}
            placeholder="0-15"
            value={quizFormDraft.groupCorrect}
            onChange={(event) => updateGroupCorrect(event.target.value)}
          />
        </label>

        {people.length === 0 ? (
          <p className="muted">Add people on the Analytics page to record individual scores.</p>
        ) : (
          <ul className="person-batch-list">
            {people.map((person) => {
              const score = quizFormDraft.personScores[person.id] ?? { correct: "", incorrect: "" };
              return (
                <li key={person.id} className="person-batch-row">
                  <span className="person-name">{person.name}</span>
                  <label>
                    Correct
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={score.correct}
                      onChange={(event) => updatePersonScore(person.id, "correct", event.target.value)}
                    />
                  </label>
                  <label>
                    Incorrect
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={score.incorrect}
                      onChange={(event) => updatePersonScore(person.id, "incorrect", event.target.value)}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={resetQuizFormDraft}>
            Reset form
          </button>
          <button type="submit" disabled={isSaving}>
            Submit session
          </button>
        </div>
      </form>
    </section>
  );
}
