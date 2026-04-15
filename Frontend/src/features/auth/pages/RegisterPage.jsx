import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../services/auth.api.service';
import './RegisterPage.css';

const initialForm = {
  username: '',
  email: '',
  password: '',
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'We could not create your account right now. Please try again.'
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedData = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };

    if (!trimmedData.username || !trimmedData.email || !trimmedData.password) {
      setErrorMessage('Please fill in username, email, and password.');
      return;
    }

    if (trimmedData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser(trimmedData);
      setFormData(initialForm);
      setSuccessMessage('Account created successfully. You can log in once your backend confirms the session flow.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-page__hero">
        <div className="register-page__hero-card">
          <span className="register-page__eyebrow">Holos Workspace</span>
          <h1>Start your account with a clean, calm onboarding flow.</h1>
          <p>
            Create your profile, keep your conversations in one place, and step
            into the app with a layout that feels intentional from the first
            screen.
          </p>
          <ul className="register-page__highlights">
            <li>Fast signup</li>
            <li>Simple validation</li>
            <li>Ready for backend integration</li>
          </ul>
        </div>
      </section>

      <section className="register-page__panel" aria-label="Register form">
        <div className="register-page__form-shell">
          <h2>Create account</h2>
          <p className="register-page__subcopy">
            Use a username, your email address, and a secure password to get
            started.
          </p>

          <form className="register-page__form" onSubmit={handleSubmit}>
            <div className="register-page__field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="register-page__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="register-page__field">
              <div className="register-page__password-row">
                <label htmlFor="password">Password</label>
                <span className="register-page__password-hint">
                  Minimum 8 characters
                </span>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            {errorMessage ? (
              <p className="register-page__message register-page__message--error">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="register-page__message register-page__message--success">
                {successMessage}
              </p>
            ) : null}

            <button
              className="register-page__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="register-page__footer">
            <span>Already have an account?</span>
            <Link to="/login">Go to login</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
