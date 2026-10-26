import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react';
import { sb } from './supabaseClient';

const DAYS = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 7, label: 'Sun', full: 'Sunday' },
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

export default function Schedule({ user, profile, refreshProfile }) {
  let currentDayOfWeek = new Date().getDay();
  if (currentDayOfWeek === 0) currentDayOfWeek = 7;

  const [selectedDay, setSelectedDay] = useState(currentDayOfWeek);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.id) fetchTasks();
  }, [user, selectedDay]);

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
      (t) => t.day_of_week === null || t.day_of_week === selectedDay
    );

    const merged = filteredTasks.map((ct) => {
      const completion = (completedTasks || []).find(
        (t) => t.task_key === ct.key
      );
      return { ...ct, done: completion ? completion.done : false };
    });

    setTasks(merged);
    setLoading(false);
  };

  const toggleTask = async (taskKey, currentStatus) => {
    if (selectedDay !== currentDayOfWeek) return;

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
          Your Schedule
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#8E9EBA',
            marginTop: '6px',
            fontWeight: '500',
          }}
        >
          Plan your week ahead.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '30px',
          background: '#131C35',
          padding: '15px',
          borderRadius: '24px',
          border: '1px solid #1E2B4D',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }}
      >
        {DAYS.map((day) => {
          const isSelected = selectedDay === day.id;
          const isToday = currentDayOfWeek === day.id;

          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: isSelected ? '#F4B41A' : 'transparent',
                border: 'none',
                borderRadius: '16px',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: isSelected ? '#060B19' : '#8E9EBA',
                }}
              >
                {day.label}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: '900',
                  color: isSelected ? '#060B19' : isToday ? '#F4B41A' : '#fff',
                }}
              >
                {day.id}
              </span>
              {isToday && !isSelected && (
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#F4B41A',
                  }}
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            color: '#F4B41A',
            marginTop: '50px',
            fontWeight: 'bold',
          }}
        >
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#8E9EBA', marginTop: '50px' }}
        >
          <CalendarIcon
            size={48}
            style={{ margin: '0 auto 15px auto', opacity: 0.5 }}
          />
          <p>
            No tasks scheduled for{' '}
            {DAYS.find((d) => d.id === selectedDay)?.full}.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {tasks.map((task) => (
            <motion.div
              key={task.key}
              variants={itemVariants}
              onClick={() => task.details && setSelectedTask(task)}
              className={`task-card ${task.done ? 'done' : ''}`}
              style={{
                borderRadius: '20px',
                padding: '20px',
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
                    cursor:
                      selectedDay === currentDayOfWeek ? 'pointer' : 'default',
                    padding: 0,
                    marginTop: '2px',
                  }}
                >
                  {task.done ? (
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
                      marginBottom: '6px',
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
                        <Clock size={12} /> {task.duration_min} min
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: task.done ? '#8E9EBA' : '#fff',
                      textDecoration: task.done ? 'line-through' : 'none',
                      marginBottom: '8px',
                    }}
                  >
                    {task.icon} {task.label}
                  </h3>
                  {task.details && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#F4B41A',
                        marginTop: '5px',
                        fontWeight: '700',
                      }}
                    >
                      View Details →
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* DETAILS POPUP */}
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
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
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
                  fontSize: '22px',
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
