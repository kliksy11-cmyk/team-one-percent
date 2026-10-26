import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { sb } from './supabaseClient';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function Ranks({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await sb
      .from('profiles')
      .select('id, username, xp, title, avatar_url')
      .order('xp', { ascending: false });
    if (!error && data) setLeaderboard(data);
    setLoading(false);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown size={20} color="#F4B41A" />;
    if (index === 1) return <Medal size={20} color="#A1A1AA" />;
    if (index === 2) return <Medal size={20} color="#B45309" />;
    return (
      <span style={{ color: '#52525B', fontWeight: '900', fontSize: '14px' }}>
        #{index + 1}
      </span>
    );
  };

  const getRankColor = (index) => {
    if (index === 0) return '#F4B41A';
    if (index === 1) return '#D4D4D8';
    if (index === 2) return '#B45309';
    return '#fff';
  };

  if (loading)
    return (
      <div
        style={{
          textAlign: 'center',
          color: '#F4B41A',
          marginTop: '50px',
          fontWeight: 'bold',
        }}
      >
        Loading Leaderboard...
      </div>
    );

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '30px' }}
      >
        <h2
          style={{
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '-1px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Trophy size={28} color="#F4B41A" /> Global Ranks
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#8E9EBA',
            marginTop: '6px',
            fontWeight: '500',
          }}
        >
          The hardest workers on TEAM 1%.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {leaderboard.map((player, index) => {
          const isCurrentUser = player.id === user.id;
          return (
            <motion.div
              key={player.id}
              variants={itemVariants}
              style={{
                background: isCurrentUser
                  ? 'rgba(244, 180, 26, 0.1)'
                  : '#131C35',
                border: `1px solid ${isCurrentUser ? '#F4B41A' : '#1E2B4D'}`,
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  width: '30px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {getRankIcon(index)}
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#1E2B4D',
                  overflow: 'hidden',
                  border: `2px solid ${
                    isCurrentUser ? '#F4B41A' : getRankColor(index)
                  }`,
                }}
              >
                <img
                  src={
                    player.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`
                  }
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {player.username}{' '}
                  {isCurrentUser && (
                    <span
                      style={{
                        fontSize: '10px',
                        background: '#F4B41A',
                        color: '#060B19',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      YOU
                    </span>
                  )}
                </h3>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#8E9EBA',
                    fontStyle: 'italic',
                    marginTop: '2px',
                  }}
                >
                  {player.title || 'Rookie'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    color: getRankColor(index),
                  }}
                >
                  {player.xp || 0}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#52525B',
                    display: 'block',
                    fontWeight: 'bold',
                  }}
                >
                  XP
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
