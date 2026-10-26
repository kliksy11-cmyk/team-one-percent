import React, { useState } from 'react';
import { sb } from './supabaseClient';
import Logo from './Logo';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Please fill both fields');

    setError('');
    setLoading(true);

    try {
      const { data, error: rpcError } = await sb.rpc('api_login', {
        p_user: username,
        p_pass: password,
      });

      if (rpcError) throw new Error(rpcError.message);
      if (data.error) throw new Error(data.error);

      localStorage.setItem('team_user', JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        color: '#fff',
        backgroundColor: '#060B19',
      }}
    >
      <div className="app-background"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '400px', zIndex: 10 }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#F4B41A',
                filter: 'blur(40px)',
                opacity: 0.3,
              }}
            ></div>
            <Logo size={80} />
          </div>

          <h1
            className="serif"
            style={{
              color: '#fff',
              fontSize: '36px',
              marginTop: '20px',
              margin: 0,
            }}
          >
            TEAM <span style={{ color: '#F4B41A' }}>1%</span>
          </h1>
          <p
            style={{
              color: '#8E9EBA',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginTop: '8px',
              fontWeight: '700',
            }}
          >
            Islamic Self Improvement
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(255, 79, 79, 0.1)',
              border: '1px solid rgba(255, 79, 79, 0.3)',
              color: '#ff4f4f',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '20px',
              fontWeight: '600',
            }}
          >
            {error}
          </motion.div>
        )}

        <form
          onSubmit={handleAuth}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '18px',
              borderRadius: '16px',
              border: '1px solid #1E2B4D',
              background: 'rgba(19, 28, 53, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              outline: 'none',
              fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '18px',
              borderRadius: '16px',
              border: '1px solid #1E2B4D',
              background: 'rgba(19, 28, 53, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              outline: 'none',
              fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F4B41A, #D99A0C)',
              color: '#060B19',
              fontWeight: '900',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 30px rgba(244, 180, 26, 0.3)',
              marginTop: '10px',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> CONNECTING...
              </>
            ) : (
              'ENTER THE ARENA'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
