export function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Woodcrest Interiors home">
        <img className="brand-logo" src="./images/woodcrest-logo.jpg" alt="" />
        <span>WOODCREST INTERIORS</span>
      </a>
      <nav className="main-nav" aria-label="Primary">
        <a href="#about">About</a>
        <a href="#collections">Wall Panels</a>
        <a href="#collections">Collections</a>
        <a href="#projects">Projects</a>
        <a href="#why-us">Why Us</a>
        <a href="#contact">Contact</a>
      </nav>
      <a className="quote-button" href="#contact">Get a Quote</a>
    </header>
  );
}
