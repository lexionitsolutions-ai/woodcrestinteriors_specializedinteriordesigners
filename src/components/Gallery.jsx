const projects = [
  ['Modern Living Room', './images/wood-interior-8.jpg'],
  ['Luxury Bedroom', './images/wood-interior-2.jpg'],
  ['Executive Office', './images/wood-interior-4.webp'],
  ['Reception Interior', './images/wood-interior-6.jpg'],
  ['TV Unit Wall', './images/wood-interior-3.jpg'],
  ['Restaurant Interior', './images/wood-interior-5.jpg']
];

export function Gallery() {
  return (
    <section id="projects" className="section gallery-section">
      <p className="eyebrow">Projects</p>
      <h2>Measured, material-led interiors across residential and commercial spaces.</h2>
      <div className="project-grid">
        {projects.map(([project, image]) => (
          <article className="project-card" key={project}>
            <img loading="lazy" src={image} alt={project} />
            <h3>{project}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
