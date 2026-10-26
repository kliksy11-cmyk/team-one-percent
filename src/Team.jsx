import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Plus,
  LogIn,
  LogOut,
  Copy,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { sb } from './supabaseClient';

export default function Team({
  isOpen,
  onClose,
  user,
  profile,
  refreshProfile,
}) {
  const [view, setView] = useState('loading');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      if (profile.team_id) fetchTeamDetails(profile.team_id);
      else setView('join');
    }
  }, [isOpen, profile]);

  const fetchTeamDetails = async (teamId) => {
    setLoading(true);
    const { data: teamData } = await sb
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    const { data: membersData } = await sb
      .from('profiles')
      .select('id, username, xp, avatar_url')
      .eq('team_id', teamId)
      .order('xp', { ascending: false });

    if (teamData) {
      setTeam(teamData);
      setMembers(membersData || []);
      setView('dashboard');
    } else setView('join');
    setLoading(false);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data: newTeam, error: teamError } = await sb
        .from('teams')
        .insert([{ name: teamName.trim(), invite_code: code }])
        .select()
        .single();
      if (teamError) throw teamError;
      const { error: profileError } = await sb
        .from('profiles')
        .update({ team_id: newTeam.id })
        .eq('id', user.id);
      if (profileError) throw profileError;

      await refreshProfile();
      setTeam(newTeam);
      setTeamName('');
      fetchTeamDetails(newTeam.id);
    } catch (err) {
      alert('Error creating team: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);

    try {
      const { data: foundTeam, error: findError } = await sb
        .from('teams')
        .select('*')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();
      if (findError || !foundTeam) throw new Error('Invalid invite code.');
      const { error: profileError } = await sb
        .from('profiles')
        .update({ team_id: foundTeam.id })
        .eq('id', user.id);
      if (profileError) throw profileError;

      await refreshProfile();
      setTeam(foundTeam);
      setInviteCode('');
      fetchTeamDetails(foundTeam.id);
    } catch (err) {
      alert('Error joining team: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    setLoading(true);
    try {
      await sb.from('profiles').update({ team_id: null }).eq('id', user.id);
      await refreshProfile();
      setTeam(null);
      setView('join');
    } catch (err) {
      alert('Error leaving team: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <Users size={20} color="#F4B41A" />
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
                  My Team
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#F4B41A',
                    margin: 0,
                    fontWeight: '600',
                  }}
                >
                  Accountability
                </p>
              </div>
            </div>
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '30px 20px' }}>
            {view === 'loading' && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#F4B41A',
                  marginTop: '50px',
                  fontWeight: 'bold',
                }}
              >
                Loading Team...
              </div>
            )}

            {view === 'join' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    color: '#fff',
                    marginBottom: '10px',
                    textAlign: 'center',
                  }}
                >
                  Join the Arena
                </h2>
                <p
                  style={{
                    color: '#8E9EBA',
                    textAlign: 'center',
                    marginBottom: '40px',
                  }}
                >
                  Create a squad or join your friends.
                </p>

                <form
                  onSubmit={handleCreateTeam}
                  style={{
                    background: '#131C35',
                    padding: '25px',
                    borderRadius: '24px',
                    border: '1px solid #1E2B4D',
                    marginBottom: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <h3
                    style={{
                      color: '#fff',
                      fontSize: '16px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '800',
                    }}
                  >
                    <Plus size={18} color="#F4B41A" /> Create a Team
                  </h3>
                  <input
                    type="text"
                    placeholder="Team Name..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#060B19',
                      border: '1px solid #1E2B4D',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      outline: 'none',
                      marginBottom: '15px',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!teamName.trim() || loading}
                    style={{
                      width: '100%',
                      background: '#F4B41A',
                      color: '#060B19',
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: '900',
                      border: 'none',
                      cursor:
                        !teamName.trim() || loading ? 'not-allowed' : 'pointer',
                      opacity: !teamName.trim() || loading ? 0.5 : 1,
                    }}
                  >
                    Create Team
                  </motion.button>
                </form>

                <div
                  style={{
                    textAlign: 'center',
                    color: '#52525B',
                    fontWeight: '800',
                    marginBottom: '20px',
                  }}
                >
                  OR
                </div>

                <form
                  onSubmit={handleJoinTeam}
                  style={{
                    background: '#131C35',
                    padding: '25px',
                    borderRadius: '24px',
                    border: '1px solid #1E2B4D',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <h3
                    style={{
                      color: '#fff',
                      fontSize: '16px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '800',
                    }}
                  >
                    <LogIn size={18} color="#F4B41A" /> Join a Team
                  </h3>
                  <input
                    type="text"
                    placeholder="6-Letter Invite Code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#060B19',
                      border: '1px solid #1E2B4D',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      outline: 'none',
                      marginBottom: '15px',
                      textTransform: 'uppercase',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!inviteCode.trim() || loading}
                    style={{
                      width: '100%',
                      background: '#1E2B4D',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: '900',
                      border: 'none',
                      cursor:
                        !inviteCode.trim() || loading
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: !inviteCode.trim() || loading ? 0.5 : 1,
                    }}
                  >
                    Join Team
                  </motion.button>
                </form>
              </motion.div>
            )}

            {view === 'dashboard' && team && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(244, 180, 26, 0.1)',
                      border: '2px solid #F4B41A',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 auto 15px auto',
                      boxShadow: '0 0 30px rgba(244, 180, 26, 0.2)',
                    }}
                  >
                    <Shield size={40} color="#F4B41A" />
                  </div>
                  <h1
                    style={{
                      fontSize: '28px',
                      fontWeight: '900',
                      color: '#fff',
                    }}
                  >
                    {team.name}
                  </h1>
                  <p
                    style={{
                      color: '#8E9EBA',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    {members.length} Members
                  </p>
                </div>

                <div
                  style={{
                    background: '#131C35',
                    padding: '20px',
                    borderRadius: '20px',
                    border: '1px solid #1E2B4D',
                    marginBottom: '30px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      color: '#8E9EBA',
                      fontSize: '12px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                      letterSpacing: '1px',
                    }}
                  >
                    Team Invite Code
                  </p>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: '900',
                      color: '#F4B41A',
                      letterSpacing: '5px',
                      marginBottom: '15px',
                    }}
                  >
                    {team.invite_code}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={copyCode}
                    style={{
                      background: '#1E2B4D',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={16} color="#F4B41A" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy Code
                      </>
                    )}
                  </motion.button>
                </div>

                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    color: '#8E9EBA',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '15px',
                  }}
                >
                  Team Members
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '30px',
                  }}
                >
                  {members.map((member, index) => (
                    <div
                      key={member.id}
                      style={{
                        background: '#131C35',
                        padding: '15px',
                        borderRadius: '16px',
                        border: '1px solid #1E2B4D',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                      }}
                    >
                      <span
                        style={{
                          color: '#52525B',
                          fontWeight: '900',
                          width: '20px',
                        }}
                      >
                        #{index + 1}
                      </span>
                      <img
                        src={
                          member.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`
                        }
                        alt="avatar"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: '#fff', fontWeight: '700' }}>
                          {member.username}{' '}
                          {member.id === user.id && (
                            <span
                              style={{ color: '#F4B41A', fontSize: '10px' }}
                            >
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                      <span style={{ color: '#F4B41A', fontWeight: '900' }}>
                        {member.xp || 0} XP
                      </span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLeaveTeam}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 79, 79, 0.1)',
                    color: '#ff4f4f',
                    border: '1px solid rgba(255, 79, 79, 0.3)',
                    padding: '16px',
                    borderRadius: '16px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <LogOut size={18} /> Leave Team
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
