import { FormEvent, useEffect, useState } from "react";
import { dataService } from "../lib/dataService";
import type { Person } from "../types";

export function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadPeople() {
    try {
      setIsLoading(true);
      setError("");
      setPeople(await dataService.listPeople());
    } catch (loadError) {
      setError(`Failed to load people: ${String(loadError)}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPeople();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
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
      await loadPeople();
    } catch (createError) {
      setError(`Failed to add person: ${String(createError)}`);
    }
  }

  return (
    <section>
      <h2>People</h2>
      <p>Add people who are taking quizzes and track their progress.</p>
      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alice" />
        </label>
        <button type="submit">Add person</button>
      </form>
      {error && <p className="error">{error}</p>}
      {isLoading ? (
        <p>Loading...</p>
      ) : people.length === 0 ? (
        <p>No people yet.</p>
      ) : (
        <div className="card">
          <h3>People list</h3>
          <ul>
            {people.map((person) => (
              <li key={person.id}>{person.name}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
