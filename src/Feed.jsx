import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageSquare,
  Image as ImageIcon,
  User,
  CheckCircle2,
} from 'lucide-react';
import { sb } from './supabaseClient';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function Feed({ user, profile }) {
  const [messages, setMessages] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchFeedData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFeedData = async () => {
    setLoading(true);

    let feedQuery = sb
      .from('feed')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    if (profile?.team_id) feedQuery = feedQuery.eq('team_id', profile.team_id);
    const { data: feedData } = await feedQuery;

    let proofQuery = sb
      .from('tasks')
      .select('*')
      .eq('date', today)
      .not('proof_url', 'is', null)
      .order('created_at', { ascending: false });
    if (profile?.team_id)
      proofQuery = proofQuery.eq('team_id', profile.team_id);
    const { data: proofData } = await proofQuery;

    const { data: profilesData } = await sb
      .from('profiles')
      .select('id, username, avatar_url');

    const profileMap = (profilesData || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const formattedMessages = (feedData || []).map((m) => ({
      ...m,
      profile: profileMap[m.user_id] || {
        username: 'Unknown',
        avatar_url: null,
      },
    }));
    const formattedProofs = (proofData || []).map((p) => ({
      ...p,
      profile: profileMap[p.user_id] || {
        username: 'Unknown',
        avatar_url: null,
      },
    }));

    setMessages(formattedMessages);
    setProofs(formattedProofs);
    setLoading(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = input;
    setInput('');

    const tempMsg = {
      id: Date.now(),
      user_id: user.id,
      message: msg,
      created_at: new Date().toISOString(),
      profile: profile,
    };
    setMessages((prev) => [...prev, tempMsg]);

    await sb
      .from('feed')
      .insert([
        { user_id: user.id, message: msg, team_id: profile?.team_id || null },
      ]);
    fetchFeedData();
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
        Loading Feed...
      </div>
    );

  return (
    <div
      style={{
        padding: '20px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '20px' }}
      >
        <h2
          style={{
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '-1px',
            color: '#fff',
          }}
        >
          Team Feed
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#8E9EBA',
            marginTop: '6px',
            fontWeight: '500',
          }}
        >
          Stay accountable with your team.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: '#131C35',
          border: '1px solid #1E2B4D',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '350px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            padding: '15px 20px',
            borderBottom: '1px solid #1E2B4D',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <MessageSquare size={18} color="#F4B41A" />
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
            Team Chat
          </h3>
        </div>

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
          {messages.length === 0 ? (
            <p
              style={{
                color: '#52525B',
                textAlign: 'center',
                marginTop: '20px',
                fontSize: '14px',
              }}
            >
              No messages yet. Say salaam to your team!
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === user.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  <img
                    src={
                      msg.profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.profile?.username}`
                    }
                    alt="avatar"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#1E2B4D',
                    }}
                  />
                  <div
                    style={{
                      background: isMe ? '#F4B41A' : '#1E2B4D',
                      color: isMe ? '#060B19' : '#fff',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      borderBottomRightRadius: isMe ? '4px' : '16px',
                      borderBottomLeftRadius: isMe ? '16px' : '4px',
                      maxWidth: '75%',
                    }}
                  >
                    {!isMe && (
                      <p
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          marginBottom: '4px',
                          color: '#8E9EBA',
                        }}
                      >
                        {msg.profile?.username}
                      </p>
                    )}
                    <p style={{ fontSize: '14px', lineHeight: '1.4' }}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={sendMessage}
          style={{
            padding: '15px',
            borderTop: '1px solid #1E2B4D',
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Post a message..."
            style={{
              flex: 1,
              background: '#060B19',
              border: '1px solid #1E2B4D',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '20px',
              outline: 'none',
              fontSize: '14px',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!input.trim()}
            style={{
              background: input.trim() ? '#F4B41A' : '#1E2B4D',
              color: input.trim() ? '#060B19' : '#52525B',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={18} />
          </motion.button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3
          style={{
            fontSize: '12px',
            fontWeight: '900',
            color: '#8E9EBA',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
          }}
        >
          <ImageIcon size={16} /> Today's Proofs
        </h3>

        {proofs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#52525B',
              padding: '40px',
              background: '#131C35',
              borderRadius: '24px',
              border: '1px dashed #1E2B4D',
            }}
          >
            <p style={{ fontSize: '14px' }}>No proofs uploaded today.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
            }}
          >
            {proofs.map((proof) => (
              <motion.div
                key={proof.id}
                variants={itemVariants}
                style={{
                  background: '#131C35',
                  border: '1px solid #1E2B4D',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                }}
              >
                {proof.proof_url.includes('?txt=1') ? (
                  <div
                    style={{
                      height: '120px',
                      background: '#1E2B4D',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={24} color="#F4B41A" />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff',
                      }}
                    >
                      Timer Verified
                    </span>
                  </div>
                ) : (
                  <img
                    src={proof.proof_url}
                    alt="proof"
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div
                  style={{
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <img
                    src={
                      proof.profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${proof.profile?.username}`
                    }
                    alt="avatar"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#1E2B4D',
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#fff',
                        lineHeight: 1,
                      }}
                    >
                      {proof.profile?.username}
                    </p>
                    <p
                      style={{
                        fontSize: '9px',
                        color: '#8E9EBA',
                        marginTop: '2px',
                      }}
                    >
                      {proof.task_key}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
