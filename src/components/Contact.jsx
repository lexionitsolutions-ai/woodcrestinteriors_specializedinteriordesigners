import { useState } from 'react';

export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="section contact-section">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>Plan a wall finish that fits your space, budget and timeline.</h2>
        <p>Share a few details and our design team will respond with material guidance, samples and a consultation slot.</p>
      </div>
      <form className="contact-form" onSubmit={(event) => {
        event.preventDefault();
        event.currentTarget.reset();
        setSent(true);
      }}>
        <label>Name<input required name="name" autoComplete="name" /></label>
        <label>Contact Number<input required name="phone" autoComplete="tel" /></label>
        <label>Email<input required name="email" type="email" autoComplete="email" /></label>
        <label>Interested In<input required name="interest" /></label>
        <label>Message<textarea required name="message" rows="4" /></label>
        <button className="primary-button" type="submit">Submit Enquiry</button>
        {sent && <p className="form-note" role="status">Thank you. Our team will contact you shortly.</p>}
      </form>
    </section>
  );
}
