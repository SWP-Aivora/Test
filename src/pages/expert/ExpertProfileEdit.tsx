import React, { useEffect, useState } from 'react';
import { ExpertLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, Mail, Phone, Award, DollarSign, Loader, Sparkles, X, Plus } from 'lucide-react';
import api from '../../services/api';

interface ExpertProfile {
  id: string;
  title?: string;
  bio?: string;
  hourlyRate?: number;
  skills: Array<{ id: string; name: string }>;
}

interface Skill {
  id: string;
  name: string;
}

export const ExpertProfileEdit: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  
  // Profile specific states
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState<string>('35');

  // Selected skill to append
  const [newSkillId, setNewSkillId] = useState<string>('');

  const fetchProfileDetails = async () => {
    try {
      // 1. Fetch Expert Profile info
      const profileRes = await api.get('/profiles/expert');
      const data = profileRes.data;
      setProfile(data);
      
      setTitle(data.title || '');
      setBio(data.bio || '');
      setHourlyRate((data.hourlyRate || 35).toString());

      // 2. Fetch available platform skills
      const skillRes = await api.get('/skills');
      setAvailableSkills(skillRes.data || []);
    } catch (err) {
      console.warn('[ProfileEdit] Failed to fetch expert profile details, using mockups:', err);
      setProfile({
        id: 'exp-alice',
        title: 'Lead Product Interface Architect',
        bio: 'I am a specialized frontend designer with 5+ years of experience crafting modern, highly-animated glassmorphic websites.',
        hourlyRate: 45,
        skills: [
          { id: 's1', name: 'React' },
          { id: 's3', name: 'Figma' },
          { id: 's4', name: 'UI/UX' }
        ]
      });
      setAvailableSkills([
        { id: 's1', name: 'React' },
        { id: 's2', name: 'NodeJS' },
        { id: 's3', name: 'Figma' },
        { id: 's4', name: 'UI/UX' },
        { id: 's5', name: 'TypeScript' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Update Global Profile (fullName, phone, avatar)
      await updateUserProfile({
        fullName,
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined
      });

      // 2. Update Expert Profile details
      await api.put('/profiles/expert', {
        title: title || undefined,
        bio: bio || undefined,
        hourlyRate: Number(hourlyRate) || undefined
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('[ProfileEdit] Profile saving failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Add Skill Tag to expert profile
  const handleAddSkill = async () => {
    if (!newSkillId || !profile) return;
    try {
      await api.post('/skills/expert/me', { skillId: newSkillId });
      setNewSkillId('');
      // Reload profile
      await fetchProfileDetails();
    } catch (err) {
      console.error('[ProfileEdit] Add skill tag failed:', err);
      // Mock append on failure
      const toAdd = availableSkills.find(s => s.id === newSkillId);
      if (toAdd && profile) {
        setProfile({
          ...profile,
          skills: [...profile.skills, toAdd]
        });
      }
    }
  };

  // Remove Skill Tag from expert profile
  const handleRemoveSkill = async (skillId: string) => {
    if (!profile) return;
    try {
      await api.delete(`/skills/expert/me/${skillId}`);
      await fetchProfileDetails();
    } catch (err) {
      console.error('[ProfileEdit] Delete skill tag failed:', err);
      // Mock remove on failure
      setProfile({
        ...profile,
        skills: profile.skills.filter(s => s.id !== skillId)
      });
    }
  };

  return (
    <ExpertLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Left panel: Core forms */}
          <form onSubmit={handleSaveProfile} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}>
                <User size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Profile Settings</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage your personal details and professional freelance description</p>
              </div>
            </div>

            {saveSuccess && (
              <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', textTransform: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
                Profile details updated successfully!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Personal Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="input-label" htmlFor="fullname-input">Full Name *</label>
                  <input
                    id="fullname-input"
                    type="text"
                    className="input-field"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="input-label" htmlFor="phone-input">Phone Contact Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="phone-input"
                      type="tel"
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+84 90..."
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="avatar-url-input">Profile Avatar Image Url</label>
                <input
                  id="avatar-url-input"
                  type="url"
                  className="input-field"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  disabled={saving}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Expert Business Parameters</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="input-label" htmlFor="professional-title-input">Professional Title *</label>
                    <input
                      id="professional-title-input"
                      type="text"
                      className="input-field"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Fullstack React Developer"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="input-label" htmlFor="hourly-rate-input">Hourly Bidding Rate ($) *</label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={16} color="var(--success)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="hourly-rate-input"
                        type="number"
                        className="input-field"
                        style={{ paddingLeft: '2.5rem' }}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label" htmlFor="biography-input">Professional Biography Bio *</label>
                  <textarea
                    id="biography-input"
                    className="input-field"
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your design principles, software expertise, past deliveries..."
                    required
                    disabled={saving}
                  />
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ padding: '0.75rem 2rem' }} disabled={saving}>
                {saving ? <Loader size={18} className="spinner" /> : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Right panel: Skill Tag Manager */}
          <aside className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <Award size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Specialized Skills tags</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add skill tags to enable AI matchmaking recommendations algorithms.</p>
            </div>

            {/* Current skill list badges */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {profile?.skills.map((sk) => (
                <div
                  key={sk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.75rem',
                    background: 'var(--accent-glow)',
                    border: '1px solid rgba(250,89,65,0.3)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  {sk.name}
                  <button
                    onClick={() => handleRemoveSkill(sk.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--danger)', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(!profile?.skills || profile.skills.length === 0) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '1rem 0' }}>No skills added. Add skills using the console below.</div>
              )}
            </div>

            {/* Append skill form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Append Skills Credentials</h4>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select
                  className="input-field"
                  value={newSkillId}
                  onChange={(e) => setNewSkillId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Choose Skill Tag --</option>
                  {availableSkills
                    // Exclude skills already present in expert profile
                    .filter(sk => !profile?.skills.some(ps => ps.id === sk.id))
                    .map((sk) => (
                      <option key={sk.id} value={sk.id}>{sk.name}</option>
                    ))
                  }
                </select>
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkillId}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

          </aside>

        </div>
      )}
    </ExpertLayout>
  );
};
