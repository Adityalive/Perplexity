import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginUser } from '../services/auth.api.service';
import './LoginPage.css';

const initialForm = {
  email: '',
  password: '',
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'We could not log you in right now. Please try again.'
  );
}

export default function LoginPage() {
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
      email: formData.email.trim(),
      password: formData.password,
    };

    if (!trimmedData.email || !trimmedData.password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await loginUser(trimmedData);
      setFormData(initialForm);
      setSuccessMessage('Welcome back. Your session has been created.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__hero">
        <div className="login-page__hero-card">
          <span className="login-page__eyebrow">Holos Workspace</span>
          <h1>Log in and pick up right where you left off.</h1>
          <p>
            Access saved prompts, recent conversations, and your full workspace
            state in one clean sign-in flow.
          </p>
          <ul className="login-page__highlights">
            <li>Secure sign in</li>
            <li>Session ready</li>
            <li>Instant access</li>
          </ul>
        </div>
      </section>

      <section className="login-page__panel" aria-label="Login form">
        <div className="login-page__form-shell">
          <h2>Welcome back</h2>
          <p className="login-page__subcopy">
            Enter your email and password to continue.
          </p>

          <form className="login-page__form" onSubmit={handleSubmit}>
            <div className="login-page__field">
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

            <div className="login-page__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            {errorMessage ? (
              <p className="login-page__message login-page__message--error">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="login-page__message login-page__message--success">
                {successMessage}
              </p>
            ) : null}

            <button
              className="login-page__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="login-page__footer">
            <span>Need an account?</span>
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
