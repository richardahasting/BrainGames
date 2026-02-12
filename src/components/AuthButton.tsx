import { useState } from 'react';
import { AuthHandle } from '../hooks/useAuth';

interface Props {
  auth: AuthHandle;
}

export default function AuthButton({ auth }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (auth.authState === 'loading') {
    return <span className="text-muted text-sm">...</span>;
  }

  if (auth.authState === 'authenticated') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">{auth.email}</span>
        <button
          onClick={() => auth.logout()}
          className="text-muted hover:text-warm-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm text-teal hover:text-teal-dim transition-colors"
      >
        Sign In
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    try {
      await auth.login(email.trim().toLowerCase());
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-teal">Check your email for the login link</span>
        <button
          onClick={() => { setShowForm(false); setStatus('idle'); setEmail(''); }}
          className="text-muted hover:text-warm-white"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        autoFocus
        className="bg-navy-lighter text-warm-white text-sm px-3 py-1.5 rounded-lg border border-navy-lighter focus:border-teal focus:outline-none w-48"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="text-sm px-3 py-1.5 bg-teal text-navy font-medium rounded-lg hover:bg-teal-dim transition-colors disabled:opacity-50"
      >
        {status === 'sending' ? '...' : 'Go'}
      </button>
      <button
        type="button"
        onClick={() => { setShowForm(false); setStatus('idle'); setEmail(''); }}
        className="text-muted hover:text-warm-white text-sm"
      >
        ✕
      </button>
      {status === 'error' && (
        <span className="text-wrong text-xs">Failed, try again</span>
      )}
    </form>
  );
}
