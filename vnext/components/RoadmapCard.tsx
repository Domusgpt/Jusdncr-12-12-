const roadmap = [
  'Modular choreography blocks for rapid prototyping.',
  'Unified telemetry stream for motion + audio events.',
  'Scenario-driven rehearsals with adaptive pacing.',
];

export const RoadmapCard = () => (
  <section className="vnext-card">
    <div className="vnext-pill">VNext Roadmap</div>
    <h2>Parallel research lane</h2>
    <p>Designed to evolve independently while sharing only stable primitives.</p>
    <ul className="vnext-list">
      {roadmap.map((item) => (
        <li key={item}>
          <span aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  </section>
);
