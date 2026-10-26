import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  User,
  Dumbbell,
  BookOpen,
  Brain,
  CheckCircle2,
  Plus,
  ChevronRight,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { sb } from './supabaseClient';

const Slider = React.memo(
  ({ label, value, onChange, min, max, step, unit }) => (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <span style={{ color: '#8E9EBA', fontSize: '14px', fontWeight: '600' }}>
          {label}
        </span>
        <span style={{ color: '#F4B41A', fontSize: '16px', fontWeight: '800' }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          accentColor: '#F4B41A',
          height: '6px',
          borderRadius: '5px',
          outline: 'none',
        }}
      />
    </div>
  )
);

const DAYS = [
  { id: 1, label: 'M' },
  { id: 2, label: 'T' },
  { id: 3, label: 'W' },
  { id: 4, label: 'T' },
  { id: 5, label: 'F' },
  { id: 6, label: 'S' },
  { id: 7, label: 'S' },
];

export default function AIChat({
  isOpen,
  onClose,
  user,
  profile,
  onTasksGenerated,
}) {
  const [mode, setMode] = useState('loading');
  const [step, setStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentTasks, setCurrentTasks] = useState([]);
  const [hasGreeted, setHasGreeted] = useState(false);

  const [selectedGoals, setSelectedGoals] = useState([]);
  const [customGoal, setCustomGoal] = useState('');
  const [age, setAge] = useState(20);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70.0);
  const [targetWeight, setTargetWeight] = useState(65);
  const [timelineVal, setTimelineVal] = useState(1);
  const [timelineUnit, setTimelineUnit] = useState('weeks');
  const [injuries, setInjuries] = useState('');
  const [diet, setDiet] = useState('');
  const [fitnessDays, setFitnessDays] = useState([1, 3, 5]);
  const [quranTarget, setQuranTarget] = useState('');
  const [quranDays, setQuranDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [studySubject, setStudySubject] = useState('');
  const [studyDistraction, setStudyDistraction] = useState('');
  const [studyDays, setStudyDays] = useState([1, 2, 3, 4, 5]);

  const messagesEndRef = useRef(null);
  const isFitness = selectedGoals.some((g) =>
    ['Get Fit', 'Build Habits'].includes(g)
  );
  const isDeen = selectedGoals.includes('Quran & Deen');
  const isStudy = selectedGoals.includes('Study Focus');

  useEffect(() => {
    if (isOpen) checkDatabaseState();
  }, [isOpen]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const checkDatabaseState = async () => {
    const { data, count, error } = await sb
      .from('custom_tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);
    if (error) {
      setMode('wizard');
      return;
    }
    if (count > 0) {
      setCurrentTasks(data);
      setMode('chat');
      if (!hasGreeted) {
        generateGreeting(data);
        setHasGreeted(true);
      }
    } else {
      setMode('wizard');
    }
  };

  const generateGreeting = async (tasksData) => {
    let todayDay = new Date().getDay();
    if (todayDay === 0) todayDay = 7;
    const todayTasks = (tasksData || []).filter(
      (t) => t.day_of_week === null || t.day_of_week === todayDay
    );
    if (todayTasks.length > 0)
      setMessages([
        {
          role: 'ai',
          text: `As-salamu alaykum, ${
            profile?.username || 'friend'
          }! I see you have ${todayTasks.length} tasks today, including "${
            todayTasks[0].label
          }". How can I help you crush your goals today?`,
        },
      ]);
    else
      setMessages([
        {
          role: 'ai',
          text: `As-salamu alaykum, ${
            profile?.username || 'friend'
          }! I see you have a rest day today. Want to review your schedule or plan ahead?`,
        },
      ]);
  };

  const toggleGoal = (goalTitle) => {
    if (selectedGoals.includes(goalTitle))
      setSelectedGoals(selectedGoals.filter((g) => g !== goalTitle));
    else setSelectedGoals([...selectedGoals, goalTitle]);
  };

  const addCustomGoal = () => {
    if (customGoal.trim() && !selectedGoals.includes(customGoal.trim())) {
      setSelectedGoals([...selectedGoals, customGoal.trim()]);
      setCustomGoal('');
    }
  };

  const toggleDay = (dayId, currentDays, setDays) => {
    if (currentDays.includes(dayId))
      setDays(currentDays.filter((d) => d !== dayId));
    else setDays([...currentDays, dayId].sort());
  };

  const getTimelineString = () => {
    const val = parseInt(timelineVal) || 1;
    if (timelineUnit === 'days') {
      if (val < 7) return '1 week (minimum)';
      const w = Math.floor(val / 7);
      const d = val % 7;
      return d > 0
        ? `${w} week${w > 1 ? 's' : ''}, ${d} day${d > 1 ? 's' : ''}`
        : `${w} week${w > 1 ? 's' : ''}`;
    }
    if (timelineUnit === 'months') return `${val} month${val > 1 ? 's' : ''}`;
    return `${val} week${val > 1 ? 's' : ''}`;
  };

  const generatePlan = async () => {
    setStep(5);
    setIsTyping(true);
    const timeString = getTimelineString();
    let summary = `Goals: ${selectedGoals.join(', ')}.\n`;
    if (isFitness)
      summary += `Fitness: Age ${age}, Height ${height}cm, Weight ${weight}kg. Target: ${targetWeight}kg in ${timeString}. Days: [${fitnessDays.join(
        ', '
      )}]. Injuries: ${injuries || 'None'}. Diet: ${diet || 'None'}.\n`;
    if (isDeen)
      summary += `Quran: Target: ${
        quranTarget || 'General reading'
      }. Days: [${quranDays.join(', ')}].\n`;
    if (isStudy)
      summary += `Study: Subject: ${
        studySubject || 'General'
      }. Distraction: ${studyDistraction}. Days: [${studyDays.join(', ')}].\n`;

    try {
      const { data, error } = await sb.functions.invoke('ai-coach', {
        body: {
          mode: 'generate',
          message: 'Generate plan',
          profileData: summary,
          currentTasks: [],
        },
      });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const smartGoals = [];
      if (isFitness)
        smartGoals.push(`Reach ${targetWeight}kg in ${timeString}`);
      if (isDeen)
        smartGoals.push(
          quranTarget ? `Quran: ${quranTarget}` : 'Daily Quran Reading'
        );
      if (isStudy)
        smartGoals.push(
          studySubject ? `Study: ${studySubject}` : 'Study Focus'
        );
      selectedGoals.forEach((g) => {
        if (
          !['Get Fit', 'Quran & Deen', 'Study Focus', 'Build Habits'].includes(
            g
          )
        )
          smartGoals.push(g);
      });

      if (smartGoals.length > 0) {
        await sb.from('goals').delete().eq('user_id', user.id);
        await sb
          .from('goals')
          .insert(
            smartGoals.map((g) => ({
              user_id: user.id,
              title: g,
              status: 'active',
            }))
          );
      }

      if (data.tasks && data.tasks.length > 0) {
        await sb.from('custom_tasks').delete().eq('user_id', user.id);
        await sb
          .from('custom_tasks')
          .insert(
            data.tasks.map((t) => ({
              user_id: user.id,
              key:
                'ai_' +
                Date.now() +
                '_' +
                Math.random().toString(36).substr(2, 5),
              label: t.label,
              details: t.details || null,
              icon: t.icon || '✅',
              is_mandatory: t.is_mandatory,
              duration_min: t.duration_min || null,
              day_of_week: t.day_of_week !== undefined ? t.day_of_week : null,
            }))
          );
      }

      setMessages([
        {
          role: 'ai',
          text:
            data.message || 'Your plan is ready! How can I help you adjust it?',
        },
      ]);
      onTasksGenerated();
      await checkDatabaseState();
    } catch (err) {
      alert('🚨 AI ERROR: ' + err.message);
      setMessages([
        {
          role: 'ai',
          text: "I had trouble reaching the server, but I've secured your fallback plan.",
        },
      ]);
      setMode('chat');
    } finally {
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const { data: latestTasks } = await sb
        .from('custom_tasks')
        .select('*')
        .eq('user_id', user.id);
      setCurrentTasks(latestTasks || []);
      const { data, error } = await sb.functions.invoke('ai-coach', {
        body: {
          mode: 'chat',
          message: userMsg,
          profileData: `User: ${profile?.username}`,
          currentTasks: latestTasks || [],
        },
      });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: 'ai', text: data.message }]);

      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          if (action.type === 'UPDATE')
            await sb
              .from('custom_tasks')
              .update({
                details: action.new_details,
                day_of_week:
                  action.new_day !== undefined ? action.new_day : undefined,
              })
              .eq('id', action.task_id);
          else if (action.type === 'DELETE')
            await sb.from('custom_tasks').delete().eq('id', action.task_id);
          else if (action.type === 'ADD')
            await sb
              .from('custom_tasks')
              .insert([
                {
                  user_id: user.id,
                  key: 'ai_' + Date.now(),
                  label: action.label,
                  details: action.details,
                  icon: action.icon,
                  is_mandatory: action.is_mandatory,
                  duration_min: action.duration_min,
                  day_of_week: action.day_of_week,
                },
              ]);
        }
        await checkDatabaseState();
        onTasksGenerated();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: '🚨 ERROR: ' + err.message },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetPlan = async () => {
    if (
      confirm(
        'Are you sure you want to delete your current plan and goals to start over?'
      )
    ) {
      await sb.from('custom_tasks').delete().eq('user_id', user.id);
      await sb.from('goals').delete().eq('user_id', user.id);
      onTasksGenerated();
      setMode('wizard');
      setStep(1);
      setHasGreeted(false);
      setMessages([]);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: '#060B19',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto',
            borderLeft: '1px solid #1E2B4D',
            borderRight: '1px solid #1E2B4D',
          }}
        >
          <div
            className="glass"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #1E2B4D',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(244, 180, 26, 0.1)',
                  padding: '8px',
                  borderRadius: '50%',
                }}
              >
                <Sparkles size={20} color="#F4B41A" />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    margin: 0,
                    color: '#fff',
                  }}
                >
                  AI Coach
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#F4B41A',
                    margin: 0,
                    fontWeight: '600',
                  }}
                >
                  {mode === 'chat' ? 'Assistant Mode' : 'Premium Setup'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {mode === 'chat' && (
                <button
                  onClick={resetPlan}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8E9EBA',
                    cursor: 'pointer',
                  }}
                >
                  <Settings size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: '#131C35',
                  border: '1px solid #1E2B4D',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#8E9EBA',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {mode === 'loading' && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#F4B41A',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              >
                <Sparkles size={30} />
              </motion.div>
            </div>
          )}

          {mode === 'chat' && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                }}
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      alignSelf:
                        msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        flexDirection:
                          msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <div
                        style={{
                          background:
                            msg.role === 'user' ? '#1E2B4D' : '#F4B41A',
                          padding: '6px',
                          borderRadius: '50%',
                          marginTop: '4px',
                        }}
                      >
                        {msg.role === 'user' ? (
                          <User size={14} color="#fff" />
                        ) : (
                          <Sparkles size={14} color="#060B19" />
                        )}
                      </div>
                      <div
                        style={{
                          background:
                            msg.role === 'user'
                              ? '#131C35'
                              : 'rgba(244, 180, 26, 0.1)',
                          color: '#fff',
                          padding: '14px 18px',
                          borderRadius: '16px',
                          border: `1px solid ${
                            msg.role === 'user'
                              ? '#1E2B4D'
                              : 'rgba(244, 180, 26, 0.3)'
                          }`,
                          fontSize: '14px',
                          lineHeight: '1.5',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      color: '#F4B41A',
                      fontSize: '14px',
                      fontStyle: 'italic',
                      fontWeight: '600',
                    }}
                  >
                    Coach is updating your plan...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div
                style={{
                  padding: '20px',
                  borderTop: '1px solid #1E2B4D',
                  background: '#060B19',
                }}
              >
                <form
                  onSubmit={handleChatSubmit}
                  style={{ display: 'flex', gap: '10px' }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask to change your schedule..."
                    disabled={isTyping}
                    style={{
                      flex: 1,
                      background: '#131C35',
                      border: '1px solid #1E2B4D',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '24px',
                      outline: 'none',
                      opacity: isTyping ? 0.5 : 1,
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    style={{
                      background: '#F4B41A',
                      color: '#060B19',
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor:
                        !input.trim() || isTyping ? 'not-allowed' : 'pointer',
                      opacity: !input.trim() || isTyping ? 0.5 : 1,
                    }}
                  >
                    <Send size={20} />
                  </motion.button>
                </form>
              </div>
            </>
          )}

          {mode === 'wizard' && (
            <>
              {step < 5 && (
                <div
                  style={{
                    width: '100%',
                    height: '3px',
                    background: '#131C35',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                    style={{ height: '100%', background: '#F4B41A' }}
                  />
                </div>
              )}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '30px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '26px',
                          fontWeight: '900',
                          marginBottom: '10px',
                          color: '#fff',
                        }}
                      >
                        Main Focus
                      </h2>
                      <p
                        style={{
                          color: '#8E9EBA',
                          marginBottom: '30px',
                          fontWeight: '500',
                        }}
                      >
                        Select everything you want to improve.
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '15px',
                          marginBottom: '30px',
                        }}
                      >
                        {[
                          {
                            t: 'Get Fit',
                            i: (
                              <Dumbbell
                                size={28}
                                color={
                                  selectedGoals.includes('Get Fit')
                                    ? '#060B19'
                                    : '#F4B41A'
                                }
                              />
                            ),
                          },
                          {
                            t: 'Quran & Deen',
                            i: (
                              <BookOpen
                                size={28}
                                color={
                                  selectedGoals.includes('Quran & Deen')
                                    ? '#060B19'
                                    : '#F4B41A'
                                }
                              />
                            ),
                          },
                          {
                            t: 'Study Focus',
                            i: (
                              <Brain
                                size={28}
                                color={
                                  selectedGoals.includes('Study Focus')
                                    ? '#060B19'
                                    : '#F4B41A'
                                }
                              />
                            ),
                          },
                          {
                            t: 'Build Habits',
                            i: (
                              <CheckCircle2
                                size={28}
                                color={
                                  selectedGoals.includes('Build Habits')
                                    ? '#060B19'
                                    : '#F4B41A'
                                }
                              />
                            ),
                          },
                        ].map((g, i) => {
                          const sel = selectedGoals.includes(g.t);
                          return (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={i}
                              onClick={() => toggleGoal(g.t)}
                              style={{
                                background: sel ? '#F4B41A' : '#131C35',
                                border: `1px solid ${
                                  sel ? '#F4B41A' : '#1E2B4D'
                                }`,
                                borderRadius: '16px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {g.i}
                              <span
                                style={{
                                  color: sel ? '#060B19' : '#fff',
                                  fontWeight: '800',
                                }}
                              >
                                {g.t}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          marginBottom: '20px',
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Add custom goal..."
                          value={customGoal}
                          onChange={(e) => setCustomGoal(e.target.value)}
                          style={{
                            flex: 1,
                            background: '#131C35',
                            border: '1px solid #1E2B4D',
                            color: '#fff',
                            padding: '14px',
                            borderRadius: '12px',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={addCustomGoal}
                          style={{
                            background: '#F4B41A',
                            color: '#060B19',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0 20px',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(2)}
                        disabled={selectedGoals.length === 0}
                        style={{
                          width: '100%',
                          background:
                            selectedGoals.length > 0 ? '#F4B41A' : '#131C35',
                          color:
                            selectedGoals.length > 0 ? '#060B19' : '#52525B',
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: '900',
                          marginTop: 'auto',
                          border: 'none',
                          cursor:
                            selectedGoals.length > 0
                              ? 'pointer'
                              : 'not-allowed',
                        }}
                      >
                        Continue <ChevronRight size={20} />
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="s2"
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <button
                        onClick={() => setStep(1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8E9EBA',
                          cursor: 'pointer',
                          marginBottom: '20px',
                          alignSelf: 'flex-start',
                          fontWeight: 'bold',
                        }}
                      >
                        <ChevronLeft size={16} /> Back
                      </button>
                      <h2
                        style={{
                          fontSize: '26px',
                          fontWeight: '900',
                          marginBottom: '10px',
                          color: '#fff',
                        }}
                      >
                        Your Details
                      </h2>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                        }}
                      >
                        {isFitness && (
                          <div
                            style={{
                              background: '#131C35',
                              padding: '20px',
                              borderRadius: '20px',
                              border: '1px solid #1E2B4D',
                            }}
                          >
                            <h3
                              style={{
                                color: '#F4B41A',
                                fontSize: '14px',
                                marginBottom: '15px',
                                fontWeight: '800',
                              }}
                            >
                              Fitness Profile
                            </h3>
                            <Slider
                              label="Age"
                              value={age}
                              onChange={setAge}
                              min={10}
                              max={80}
                              step={1}
                              unit="yrs"
                            />
                            <Slider
                              label="Height"
                              value={height}
                              onChange={setHeight}
                              min={120}
                              max={220}
                              step={1}
                              unit="cm"
                            />
                            <Slider
                              label="Current Weight"
                              value={weight}
                              onChange={setWeight}
                              min={30}
                              max={150}
                              step={0.1}
                              unit="kg"
                            />
                            <div style={{ marginBottom: '20px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '10px',
                                }}
                              >
                                <span
                                  style={{
                                    color: '#8E9EBA',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                  }}
                                >
                                  Target Weight
                                </span>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <input
                                    type="number"
                                    value={targetWeight}
                                    onChange={(e) =>
                                      setTargetWeight(e.target.value)
                                    }
                                    style={{
                                      width: '70px',
                                      background: '#060B19',
                                      border: '1px solid #1E2B4D',
                                      color: '#F4B41A',
                                      padding: '8px',
                                      borderRadius: '8px',
                                      textAlign: 'center',
                                      outline: 'none',
                                      fontSize: '16px',
                                      fontWeight: 'bold',
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: '#F4B41A',
                                      fontSize: '14px',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    kg
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <span
                                style={{
                                  color: '#8E9EBA',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  display: 'block',
                                  marginBottom: '10px',
                                }}
                              >
                                Timeline
                              </span>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '10px',
                                  alignItems: 'center',
                                }}
                              >
                                <input
                                  type="number"
                                  min="1"
                                  value={timelineVal}
                                  onChange={(e) =>
                                    setTimelineVal(e.target.value)
                                  }
                                  style={{
                                    width: '80px',
                                    background: '#060B19',
                                    border: '1px solid #1E2B4D',
                                    color: '#fff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    outline: 'none',
                                    fontSize: '16px',
                                  }}
                                />
                                <select
                                  value={timelineUnit}
                                  onChange={(e) =>
                                    setTimelineUnit(e.target.value)
                                  }
                                  style={{
                                    flex: 1,
                                    background: '#060B19',
                                    border: '1px solid #1E2B4D',
                                    color: '#fff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="days">Days</option>
                                  <option value="weeks">Weeks</option>
                                  <option value="months">Months</option>
                                </select>
                              </div>
                              <p
                                style={{
                                  color: '#F4B41A',
                                  fontSize: '12px',
                                  marginTop: '10px',
                                  fontWeight: 'bold',
                                }}
                              >
                                = {getTimelineString()}
                              </p>
                            </div>
                            <input
                              type="text"
                              placeholder="Injuries? (e.g., Bad knee)"
                              value={injuries}
                              onChange={(e) => setInjuries(e.target.value)}
                              style={{
                                width: '100%',
                                background: '#060B19',
                                border: '1px solid #1E2B4D',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '8px',
                                marginTop: '10px',
                                outline: 'none',
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Diet? (e.g., Halal, No dairy)"
                              value={diet}
                              onChange={(e) => setDiet(e.target.value)}
                              style={{
                                width: '100%',
                                background: '#060B19',
                                border: '1px solid #1E2B4D',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '8px',
                                marginTop: '10px',
                                outline: 'none',
                              }}
                            />
                          </div>
                        )}
                        {isDeen && (
                          <div
                            style={{
                              background: '#131C35',
                              padding: '20px',
                              borderRadius: '20px',
                              border: '1px solid #1E2B4D',
                            }}
                          >
                            <h3
                              style={{
                                color: '#F4B41A',
                                fontSize: '14px',
                                marginBottom: '15px',
                                fontWeight: '800',
                              }}
                            >
                              Quran Profile
                            </h3>
                            <input
                              type="text"
                              placeholder="Target? (e.g., Memorize Juz 30)"
                              value={quranTarget}
                              onChange={(e) => setQuranTarget(e.target.value)}
                              style={{
                                width: '100%',
                                background: '#060B19',
                                border: '1px solid #1E2B4D',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '8px',
                                outline: 'none',
                              }}
                            />
                          </div>
                        )}
                        {isStudy && (
                          <div
                            style={{
                              background: '#131C35',
                              padding: '20px',
                              borderRadius: '20px',
                              border: '1px solid #1E2B4D',
                            }}
                          >
                            <h3
                              style={{
                                color: '#F4B41A',
                                fontSize: '14px',
                                marginBottom: '15px',
                                fontWeight: '800',
                              }}
                            >
                              Study Profile
                            </h3>
                            <input
                              type="text"
                              placeholder="Subject? (e.g., Biology)"
                              value={studySubject}
                              onChange={(e) => setStudySubject(e.target.value)}
                              style={{
                                width: '100%',
                                background: '#060B19',
                                border: '1px solid #1E2B4D',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                outline: 'none',
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Distraction? (e.g., Phone)"
                              value={studyDistraction}
                              onChange={(e) =>
                                setStudyDistraction(e.target.value)
                              }
                              style={{
                                width: '100%',
                                background: '#060B19',
                                border: '1px solid #1E2B4D',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '8px',
                                outline: 'none',
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(3)}
                        style={{
                          width: '100%',
                          background: '#F4B41A',
                          color: '#060B19',
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: '900',
                          marginTop: 'auto',
                          border: 'none',
                        }}
                      >
                        Next <ChevronRight size={20} />
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="s3"
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <button
                        onClick={() => setStep(2)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8E9EBA',
                          cursor: 'pointer',
                          marginBottom: '20px',
                          alignSelf: 'flex-start',
                          fontWeight: 'bold',
                        }}
                      >
                        <ChevronLeft size={16} /> Back
                      </button>
                      <h2
                        style={{
                          fontSize: '26px',
                          fontWeight: '900',
                          marginBottom: '10px',
                          color: '#fff',
                        }}
                      >
                        Your Schedule
                      </h2>
                      <p
                        style={{
                          color: '#8E9EBA',
                          marginBottom: '30px',
                          fontWeight: '500',
                        }}
                      >
                        Pick the exact days for each goal.
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                        }}
                      >
                        {isFitness && (
                          <div
                            style={{
                              background: '#131C35',
                              padding: '20px',
                              borderRadius: '20px',
                              border: '1px solid #1E2B4D',
                            }}
                          >
                            <h3
                              style={{
                                color: '#fff',
                                fontSize: '14px',
                                marginBottom: '15px',
                                fontWeight: '800',
                              }}
                            >
                              Fitness Days
                            </h3>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              {DAYS.map((d) => (
                                <button
                                  key={d.id}
                                  onClick={() =>
                                    toggleDay(d.id, fitnessDays, setFitnessDays)
                                  }
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: fitnessDays.includes(d.id)
                                      ? '#F4B41A'
                                      : '#060B19',
                                    color: fitnessDays.includes(d.id)
                                      ? '#060B19'
                                      : '#fff',
                                    border: '1px solid #1E2B4D',
                                    fontWeight: '900',
                                  }}
                                >
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {isDeen && (
                          <div
                            style={{
                              background: '#131C35',
                              padding: '20px',
                              borderRadius: '20px',
                              border: '1px solid #1E2B4D',
                            }}
                          >
                            <h3
                              style={{
                                color: '#fff',
                                fontSize: '14px',
                                marginBottom: '15px',
                                fontWeight: '800',
                              }}
                            >
                              Quran Days
                            </h3>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              {DAYS.map((d) => (
                                <button
                                  key={d.id}
                                  onClick={() =>
                                    toggleDay(d.id, quranDays, setQuranDays)
                                  }
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: quranDays.includes(d.id)
                                      ? '#F4B41A'
                                      : '#060B19',
                                    color: quranDays.includes(d.id)
                                      ? '#060B19'
                                      : '#fff',
                                    border: '1px solid #1E2B4D',
                                    fontWeight: '900',
                                  }}
                                >
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {isStudy && (
                          <div
                            style={{
                              background: '#131C35',
                              padding: '20px',
                              borderRadius: '20px',
                              border: '1px solid #1E2B4D',
                            }}
                          >
                            <h3
                              style={{
                                color: '#fff',
                                fontSize: '14px',
                                marginBottom: '15px',
                                fontWeight: '800',
                              }}
                            >
                              Study Days
                            </h3>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              {DAYS.map((d) => (
                                <button
                                  key={d.id}
                                  onClick={() =>
                                    toggleDay(d.id, studyDays, setStudyDays)
                                  }
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: studyDays.includes(d.id)
                                      ? '#F4B41A'
                                      : '#060B19',
                                    color: studyDays.includes(d.id)
                                      ? '#060B19'
                                      : '#fff',
                                    border: '1px solid #1E2B4D',
                                    fontWeight: '900',
                                  }}
                                >
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(4)}
                        style={{
                          width: '100%',
                          background: '#F4B41A',
                          color: '#060B19',
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: '900',
                          marginTop: 'auto',
                          border: 'none',
                        }}
                      >
                        Next <ChevronRight size={20} />
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="s4"
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '26px',
                          fontWeight: '900',
                          marginBottom: '10px',
                          color: '#fff',
                        }}
                      >
                        Ready to build?
                      </h2>
                      <p
                        style={{
                          color: '#8E9EBA',
                          marginBottom: '30px',
                          fontWeight: '500',
                        }}
                      >
                        The AI will now structure your weekly plan and goals.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generatePlan}
                        style={{
                          width: '100%',
                          background:
                            'linear-gradient(135deg, #F4B41A, #D99A0C)',
                          color: '#060B19',
                          padding: '18px',
                          borderRadius: '16px',
                          fontWeight: '900',
                          border: 'none',
                          marginTop: 'auto',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 8px 30px rgba(244,180,26,0.3)',
                        }}
                      >
                        <Sparkles size={22} /> Generate Master Plan
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 5 && (
                    <motion.div
                      key="s5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: 'linear',
                        }}
                        style={{
                          background: 'rgba(244, 180, 26, 0.1)',
                          padding: '25px',
                          borderRadius: '50%',
                          marginBottom: '30px',
                        }}
                      >
                        <Sparkles size={50} color="#F4B41A" />
                      </motion.div>
                      <h2
                        style={{
                          fontSize: '22px',
                          fontWeight: '900',
                          marginBottom: '10px',
                          color: '#fff',
                        }}
                      >
                        Engineering your routine...
                      </h2>
                      <p style={{ color: '#8E9EBA', fontWeight: '500' }}>
                        Scheduling tasks and setting your goals.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
