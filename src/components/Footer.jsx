import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo, Arrow } from './Icons.jsx';
import { useToast } from './Toast.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { BODY_PARTS } from '../lib/utils.js';

export default function Footer() {
  const toast = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Please enter a valid email', 'info');
    toast('You’re on the list — welcome to the lab!', 'bolt');
    setEmail('');
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="logo"><Logo /><span>Fit<em>nex</em></span></Link>
            <p className="muted" style={{ maxWidth: 360, marginTop: 16 }}>
              {t('footer.tagline', 'A free, private workout tracker built around 1,324 illustrated exercises. Your workouts stay on your device.')}
            </p>
            <form className="newsletter" onSubmit={submit}>
              <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
              <button className="btn btn-primary" type="submit" aria-label="Subscribe" style={{ padding: '0 20px' }}>
                <Arrow />
              </button>
            </form>
          </div>
          <div>
            <h5>{t('footer.explore', 'Explore')}</h5>
            <ul>
              <li><Link to="/exercises">{t('nav.library', 'Exercise library')}</Link></li>
              <li><Link to="/builder">{t('nav.builder', 'Workout builder')}</Link></li>
              <li><Link to="/#programs">{t('nav.programs', 'Programs')}</Link></li>
              <li><Link to="/exercises?fav=1">{t('nav.favorites', 'Favourites')}</Link></li>
            </ul>
          </div>
          <div>
            <h5>{t('footer.body_parts', 'Body parts')}</h5>
            <ul>
              {BODY_PARTS.slice(0, 6).map((b) => (
                <li key={b.key}><Link to={`/exercises?part=${encodeURIComponent(b.key)}`}>{t(`part.${b.key}`, b.label)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5>{t('footer.about', 'About')}</h5>
            <ul>
              <li><Link to="/#features">{t('nav.features', 'Features')}</Link></li>
              <li><Link to="/#how">{t('nav.how_it_works', 'How it works')}</Link></li>
              <li><Link to="/#faq">{t('nav.faq', 'FAQ')}</Link></li>
              <li><a href="https://gymvisual.com/" target="_blank" rel="noreferrer">{t('footer.credits', 'Illustration credits')}</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-word" aria-hidden="true">
          {'FITNEX'.split('').map((c, i) => <span key={i}>{c}</span>)}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {t('footer.rights', 'Fitnex. Train with intent.')}</span>
          <span>
            Exercise illustrations © Gym visual — <a href="https://gymvisual.com/" target="_blank" rel="noreferrer">gymvisual.com</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
