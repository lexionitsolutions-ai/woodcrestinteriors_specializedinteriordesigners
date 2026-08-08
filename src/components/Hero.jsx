export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-media" aria-hidden="true">
        <img src="./images/wood-interior-1.jpg" alt="" />
      </div>
      <div className="hero-content">
        <p className="eyebrow">Premium wall panelling studio</p>
        <h1>Transform Your Walls. Transform Your Space.</h1>
        <p>Premium wooden wall panels and contemporary interior solutions crafted for modern homes and commercial spaces.</p>
        <div className="hero-actions">
          <a className="primary-button" href="#collections">Explore Collections</a>
          <a className="secondary-button" href="#contact">Request Consultation</a>
        </div>
      </div>
    </section>
  );
}
