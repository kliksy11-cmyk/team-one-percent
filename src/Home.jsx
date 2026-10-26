import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  Circle,
  Clock,
  LogOut,
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { sb } from './supabaseClient';

// STAGGERED ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }, // 80ms delay between each item
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function Home({ user, profile, refreshProfile, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadingTask, setUploadingTask] = useState(null);

  const fileInputRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  let todayDay = new Date().getDay();
  if (todayDay === 0) todayDay = 7;

  useEffect(() => {
    if (user?.id) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: customTasks } = await sb
      .from('custom_tasks')
      .select('*')
      .eq('user_id', user.id);
    const { data: completedTasks } = await sb
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    const filteredTasks = (customTasks || []).filter(
      (t) => t.day_of_week === null || t.day_of_week === todayDay
    );

    const merged = filteredTasks.map((ct) => {
      const completion = (completedTasks || []).find(
        (t) => t.task_key === ct.key
      );
      return {
        ...ct,
        done: completion ? completion.done : false,
        proof_url: completion?.proof_url,
      };
    });

    setTasks(merged);
    setLoading(false);
  };

  const toggleTask = async (taskKey, currentStatus) => {
    if (!currentStatus && !tasks.find((t) => t.key === taskKey)?.proof_url) {
      triggerUpload(taskKey);
      return;
    }

    setTasks(
      tasks.map((t) => (t.key === taskKey ? { ...t, done: !currentStatus } : t))
    );

    await sb.rpc('api_toggle_task', {
      p_user_id: user.id,
      p_task_key: taskKey,
      p_team_id: profile?.team_id || null,
      p_date: today,
      p_done: !currentStatus,
    });

    refreshProfile();
    fetchTasks();
  };

  const triggerUpload = (taskKey) => {
    setUploadingTask(taskKey);
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingTask) return;

    const taskKey = uploadingTask;
    setUploadingTask(null);

    setTasks((prev) =>
      prev.map((t) => (t.key === taskKey ? { ...t, done: 'uploading' } : t))
    );

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await sb.storage
        .from('proofs')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw new Error('Storage: ' + uploadError.message);

      const {
        data: { publicUrl },
      } = sb.storage.from('proofs').getPublicUrl(fileName);

      const existing = tasks.find((t) => t.key === taskKey);

      if (existing) {
        const { error: dbError } = await sb
          .from('tasks')
          .update({ proof_url: publicUrl, done: true })
          .eq('user_id', user.id)
          .eq('date', today)
          .eq('task_key', taskKey);
        if (dbError) throw new Error('Database: ' + dbError.message);
      } else {
        const { error: dbError } = await sb.from('tasks').insert([
          {
            user_id: user.id,
            team_id: profile?.team_id || null,
            date: today,
            task_key: taskKey,
            proof_url: publicUrl,
            done: true,
          },
        ]);
        if (dbError) throw new Error('Database: ' + dbError.message);
      }

      await sb.rpc('api_toggle_task', {
        p_user_id: user.id,
        p_task_key: taskKey,
        p_team_id: profile?.team_id || null,
        p_date: today,
        p_done: true,
      });

      refreshProfile();
      await fetchTasks();
    } catch (err) {
      alert('🚨 UPLOAD FAILED 🚨\n' + err.message);
      setTasks((prev) =>
        prev.map((t) => (t.key === taskKey ? { ...t, done: false } : t))
      );
    }
  };

  if (loading && tasks.length === 0)
    return (
      <div
        style={{
          textAlign: 'center',
          marginTop: '50px',
          color: '#F4B41A',
          fontWeight: 'bold',
        }}
      >
        Loading...
      </div>
    );

  return (
    <div style={{ padding: '20px' }}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '35px' }}
      >
        <h2
          style={{
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '-1px',
            color: '#fff',
          }}
        >
          Today's Plan
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#8E9EBA',
            marginTop: '6px',
            fontWeight: '500',
          }}
        >
          {tasks.filter((t) => t.done === true).length} of {tasks.length} tasks
          completed
        </p>
      </motion.div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#8E9EBA', marginBottom: '20px' }}>
            No tasks for today. Ask the AI Coach to generate a plan!
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '30px',
          }}
        >
          {tasks.map((task) => (
            <motion.div
              key={task.key}
              variants={itemVariants}
              onClick={() => task.details && setSelectedTask(task)}
              className={`task-card ${task.done === true ? 'done' : ''}`}
              style={{
                borderRadius: '20px',
                padding: '22px',
                cursor: task.details ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.key, task.done);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: '2px',
                  }}
                >
                  {task.done === 'uploading' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Clock size={24} color="#F4B41A" />
                    </motion.div>
                  ) : task.done ? (
                    <CheckCircle2 size={24} color="#F4B41A" strokeWidth={2.5} />
                  ) : (
                    <Circle size={24} color="#52525B" strokeWidth={2} />
                  )}
                </button>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#F4B41A',
                        letterSpacing: '1.5px',
                      }}
                    >
                      {task.is_mandatory ? 'MANDATORY' : 'EXTRA XP'}
                    </span>
                    {task.duration_min && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#8E9EBA',
                          fontWeight: '700',
                        }}
                      >
                        <Clock size={12} /> {task.duration_min}m
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: task.done ? '#8E9EBA' : '#fff',
                      textDecoration: task.done ? 'line-through' : 'none',
                      marginBottom: '10px',
                    }}
                  >
                    {task.icon} {task.label}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '8px',
                    }}
                  >
                    {task.details && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#F4B41A',
                          fontWeight: '700',
                        }}
                      >
                        View Details →
                      </p>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerUpload(task.key);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: task.proof_url ? '#4ADE80' : '#8E9EBA',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        transition: 'all 0.2s',
                      }}
                    >
                      {task.proof_url ? (
                        <>
                          <CheckCircle2 size={14} /> Proof Uploaded
                        </>
                      ) : (
                        <>
                          <Camera size={14} /> Add Proof
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '18px',
          background: 'rgba(255, 79, 79, 0.05)',
          color: '#ff4f4f',
          border: '1px solid rgba(255, 79, 79, 0.2)',
          borderRadius: '16px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <LogOut size={20} /> LOGOUT
      </motion.button>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(6, 11, 25, 0.8)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 50, scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(145deg, #131C35, #0D1529)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '30px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '32px' }}>{selectedTask.icon}</span>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: '#fff',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '15px',
                }}
              >
                {selectedTask.label}
              </h2>
              <p
                style={{
                  color: '#8E9EBA',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedTask.details}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
