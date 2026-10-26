import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { sb } from './supabaseClient';

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

export default function Goals({ user }) {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user?.id) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await sb
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setGoals(data);
    setLoading(false);
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    setIsAdding(true);
    const { data, error } = await sb
      .from('goals')
      .insert([{ user_id: user.id, title: newGoal.trim(), status: 'active' }])
      .select()
      .single();

    if (!error && data) {
      setGoals([data, ...goals]);
      setNewGoal('');
    }
    setIsAdding(false);
  };

  const toggleGoal = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'done' : 'active';
    setGoals(goals.map((g) => (g.id === id ? { ...g, status: newStatus } : g)));
    await sb.from('goals').update({ status: newStatus }).eq('id', id);
  };

  const deleteGoal = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    setGoals(goals.filter((g) => g.id !== id));
    await sb.from('goals').delete().eq('id', id);
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'done');

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
          Your Goals
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#8E9EBA',
            marginTop: '6px',
            fontWeight: '500',
          }}
        >
          {completedGoals.length} of {goals.length} achieved
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={addGoal}
        style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}
      >
        <input
          type="text"
          placeholder="e.g., Memorize Surah Al-Mulk..."
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          style={{
            flex: 1,
            background: '#131C35',
            border: '1px solid #1E2B4D',
            color: '#fff',
            padding: '16px',
            borderRadius: '16px',
            outline: 'none',
            fontSize: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isAdding || !newGoal.trim()}
          style={{
            background: '#F4B41A',
            color: '#060B19',
            width: '56px',
            borderRadius: '16px',
            border: 'none',
            cursor: !newGoal.trim() || isAdding ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: !newGoal.trim() || isAdding ? 0.5 : 1,
            boxShadow: '0 4px 15px rgba(244,180,26,0.2)',
          }}
        >
          <Plus size={24} strokeWidth={3} />
        </motion.button>
      </motion.form>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            color: '#F4B41A',
            marginTop: '50px',
            fontWeight: 'bold',
          }}
        >
          Loading goals...
        </div>
      ) : goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#8E9EBA', marginTop: '50px' }}
        >
          <Target
            size={48}
            style={{ margin: '0 auto 15px auto', opacity: 0.5 }}
          />
          <p>No goals set yet. Add one above to get started!</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {activeGoals.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#8E9EBA',
                  letterSpacing: '1.5px',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                }}
              >
                In Progress
              </h3>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {activeGoals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    variants={itemVariants}
                    className="task-card"
                    style={{
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                    }}
                  >
                    <button
                      onClick={() => toggleGoal(goal.id, goal.status)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      <Circle size={24} color="#52525B" strokeWidth={2} />
                    </button>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#fff',
                      }}
                    >
                      {goal.title}
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ff4f4f',
                        padding: '5px',
                        opacity: 0.7,
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#F4B41A',
                  letterSpacing: '1.5px',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Sparkles size={14} /> Achieved
              </h3>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {completedGoals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    variants={itemVariants}
                    style={{
                      background: 'rgba(19, 28, 53, 0.4)',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid rgba(244, 180, 26, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      opacity: 0.6,
                    }}
                  >
                    <button
                      onClick={() => toggleGoal(goal.id, goal.status)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      <CheckCircle2
                        size={24}
                        color="#F4B41A"
                        strokeWidth={2.5}
                      />
                    </button>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#8E9EBA',
                        textDecoration: 'line-through',
                      }}
                    >
                      {goal.title}
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ff4f4f',
                        padding: '5px',
                        opacity: 0.5,
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
