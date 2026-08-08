const collections = [
  ['Walnut Slat Panels', 'Linear walnut textures for warm feature walls and media units.', './images/wood-interior-2.jpg'],
  ['Oak Acoustic Panels', 'Sound-softening oak panels for offices, studios and living spaces.', './images/wood-interior-3.jpg'],
  ['Fluted Panels', 'Architectural grooves that add rhythm, depth and shadow.', './images/wood-interior-4.webp'],
  ['Charcoal Panels', 'Deep charcoal finishes for contemporary hospitality and office interiors.', './images/wood-interior-5.jpg'],
  ['Veneer Wall Panels', 'Natural veneer sheets matched for elegant large-format surfaces.', './images/wood-interior-6.jpg'],
  ['WPC Panels', 'Durable low-maintenance profiles for high-use interior zones.', './images/wood-interior-7.jpg']
];

export function Collections() {
  return (
    <section id="collections" className="section">
      <p className="eyebrow">Collections</p>
      <h2>Wall systems tailored for modern interiors.</h2>
      <div className="card-grid">
        {collections.map(([name, text, image]) => (
          <article className="collection-card" key={name}>
            <img loading="lazy" src={image} alt={`${name} sample`} />
            <div>
              <h3>{name}</h3>
              <p>{text}</p>
              <button type="button">View Collection</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
