import { useState } from 'react';
import { verifyPrivateAccess } from '../services/auth.js';

export function EnquiryModal({ onClose, onAuthenticated }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage('');
    const form = new FormData(formElement);
    try {
      const result = await verifyPrivateAccess({
        credential: String(form.get('projectReference') || ''),
        name: String(form.get('name') || '')
      });
      if (result.ok) {
        formElement.reset();
        onAuthenticated(result.session);
      } else {
        formElement.reset();
        setMessage('Thank you. Our design team will review your request.');
        window.setTimeout(onClose, 900);
      }
    } catch (error) {
      console.error('Consultation request failed', error);
      const detail = import.meta.env.DEV && error?.message ? ` (${error.message})` : '';
      setMessage(`We could not submit this request right now. Please try again later.${detail}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="consult-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        <h2 id="consult-title">Request a Consultation</h2>
        <p>Tell us about your project and our design team will contact you.</p>
        <form onSubmit={submit} autoComplete="off">
          <label>Name<input name="name" autoComplete="name" /></label>
          <label>Contact Number<input required name="projectReference" autoComplete="new-password" inputMode="text" data-lpignore="true" data-1p-ignore="true" /></label>
          <label>Interested In<select name="interest" defaultValue="">
            <option value="">Select an option</option>
            <option>Wooden Wall Panels</option>
            <option>Acoustic Panels</option>
            <option>Fluted Panels</option>
            <option>Commercial Interior</option>
            <option>Residential Interior</option>
            <option>Custom Design</option>
          </select></label>
          <label>Project Type<select name="projectType" defaultValue="">
            <option value="">Select a project type</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Renovation</option>
            <option>New Construction</option>
          </select></label>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit Enquiry'}</button>
          {message && <p className="form-note" role="status">{message}</p>}
        </form>
      </div>
    </div>
  );
}
