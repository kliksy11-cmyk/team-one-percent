import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Snowflake,
  FastForward,
  Crown,
  Flame,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { sb } from './supabaseClient';

const STORE_ITEMS = [
  {
    id: 'freeze',
    name: 'Streak Freeze',
    desc: 'Protects your streak if you miss a day.',
    price: 300,
    icon: <Snowflake size={24} color="#3B82F6" />,
  },
  {
    id: 'skip',
    name: 'Skip Day',
    desc: 'Take a scheduled day off without losing your streak.',
    price: 500,
    icon: <FastForward size={24} color="#F4B41A" />,
  },
  {
    id: 'title_beast',
    name: 'Title: The Beast',
    desc: 'Equip the "The Beast 🔥" title on the leaderboard.',
    price: 800,
    icon: <Flame size={24} color="#EF4444" />,
  },
  {
    id: 'title_machine',
    name: 'Title: The Machine',
    desc: 'Equip the "The Machine 🤖" title on the leaderboard.',
    price: 1200,
    icon: <Crown size={24} color="#F4B41A" />,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function Store({ user, profile, refreshProfile }) {
  const [buying, setBuying] = useState(null);

  const handleBuy = async (item) => {
    if (!profile) return;
    if ((profile.coins || 0) < item.price) return alert('Not enough coins!');

    setBuying(item.id);
    try {
      const newCoins = profile.coins - item.price;
      let updates = { coins: newCoins };

      if (item.id === 'title_beast') updates.title = 'The Beast 🔥';
      else if (item.id === 'title_machine') updates.title = 'The Machine 🤖';
      else {
        const currentInventory = profile.inventory || [];
        updates.inventory = [...currentInventory, item.id];
      }

      const { error } = await sb
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;

      await refreshProfile();
      alert(`Successfully purchased ${item.name}!`);
    } catch (err) {
      alert('Error purchasing item: ' + err.message);
    } finally {
      setBuying(null);
    }
  };

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
          }}
        >
          The Store
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#8E9EBA',
            marginTop: '6px',
            fontWeight: '500',
          }}
        >
          Spend your hard-earned coins.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'linear-gradient(145deg, #131C35, #0D1529)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div>
          <p
            style={{
              color: '#8E9EBA',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '4px',
            }}
          >
            Your Balance
          </p>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#F4B41A',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Coins size={32} /> {profile?.coins || 0}
          </h1>
        </div>
        <div
          style={{
            background: 'rgba(244, 180, 26, 0.1)',
            padding: '15px',
            borderRadius: '50%',
          }}
        >
          <Shield size={32} color="#F4B41A" />
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {STORE_ITEMS.map((item) => {
          const canAfford = (profile?.coins || 0) >= item.price;
          const isBuying = buying === item.id;
          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="task-card"
              style={{
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div
                style={{
                  background: '#060B19',
                  padding: '15px',
                  borderRadius: '16px',
                  border: '1px solid #1E2B4D',
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '4px',
                  }}
                >
                  {item.name}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#8E9EBA',
                    lineHeight: '1.4',
                  }}
                >
                  {item.desc}
                </p>
              </div>
              <motion.button
                whileHover={canAfford ? { scale: 1.05 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                onClick={() => handleBuy(item)}
                disabled={!canAfford || isBuying}
                style={{
                  background: canAfford ? '#F4B41A' : '#1E2B4D',
                  color: canAfford ? '#060B19' : '#52525B',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: '900',
                  fontSize: '14px',
                  border: 'none',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isBuying ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isBuying ? (
                  '...'
                ) : (
                  <>
                    <Coins size={14} /> {item.price}
                  </>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
