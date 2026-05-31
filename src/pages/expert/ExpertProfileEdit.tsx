import React, { useEffect, useState } from 'react';
import { ExpertLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Phone, Award, DollarSign, Loader, X, Plus } from 'lucide-react';
import api from '../../services/api';

interface ExpertProfile { id: string; title?: string; bio?: string; hourlyRate?: number; skills: Array<{ id: string; name: string }>; }
interface Skill { id: string; name: string; }

export const ExpertProfileEdit: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [newSkillId, setNewSkillId] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const [pRes, sRes] = await Promise.all([api.get('/profiles/expert'), api.get('/skills')]);
      const data = pRes.data;
      setProfile(data);
      setTitle(data.title || '');
      setBio(data.bio || '');
      setHourlyRate((data.hourlyRate || 35).toString());
      setAvailableSkills(sRes.data || []);
    } catch {
      setProfile({ id: 'exp-alice', title: 'Lead Product Interface Architect', bio: 'Specialized frontend designer.', hourlyRate: 45, skills: [{ id: 's1', name: 'React' }, { id: 's3', name: 'Figma' }, { id: 's4', name: 'UI/UX' }] });
      setAvailableSkills([{ id: 's1', name: 'React' }, { id: 's2', name: 'NodeJS' }, { id: 's3', name: 'Figma' }, { id: 's4', name: 'UI/UX' }, { id: 's5', name: 'TypeScript' }]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/media/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarUrl(res.data.url || res.data);
      showToast('success', 'Avatar uploaded!');
    } catch {
      showToast('error', 'Upload failed. Use a URL instead.');
    } finally { setAvatarUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserProfile({ fullName, phone: phone || undefined, avatarUrl: avatarUrl || undefined });
      await api.put('/profiles/expert', { title: title || undefined, bio: bio || undefined, hourlyRate: Number(hourlyRate) || undefined });
      setSaveSuccess(true);
      showToast('success', 'Profile saved!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch { showToast('error', 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleAddSkill = async () => {
    if (!newSkillId || !profile) return;
    try {
      await api.post('/skills/expert/me', { skillId: newSkillId });
      setNewSkillId('');
      await fetchProfile();
    } catch {
      const skill = availableSkills.find(s => s.id === newSkillId);
      if (skill) setProfile(prev => prev ? { ...prev, skills: [...prev.skills, skill] } : null);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!profile) return;
    try { await api.delete(`/skills/expert/me/${skillId}`); await fetchProfile(); }
    catch { setProfile(prev => prev ? { ...prev, skills: prev.skills.filter(s => s.id !== skillId) } : null); }
  };

  return (
    <ExpertLayout>
      {loading ? (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}><User size={20} /></div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Profile Settings</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage your personal and professional details</p>
              </div>
            </div>

            {saveSuccess && <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', textTransform: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>Profile saved!</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="input-label">Full Name *</label>
                  <input type="text" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={saving} />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="tel" className="input-field" style={{ paddingLeft: '2.5rem' }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+84 90..." disabled={saving} />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Avatar</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="var(--text-secondary)" />}
                  </div>
                  <input type="url" className="input-field" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." disabled={saving} style={{ flex: 1 }} />
                  <label className="btn btn-secondary btn-sm" style={{ flexShrink: 0, cursor: 'pointer' }}>
                    {avatarUploading ? <Loader size={14} className="spinner" /> : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={avatarUploading} />
                  </label>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Expert Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="input-label">Professional Title *</label>
                    <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Fullstack React Developer" required disabled={saving} />
                  </div>
                  <div>
                    <label className="input-label">Hourly Rate ($) *</label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={16} color="var(--success)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="number" className="input-field" style={{ paddingLeft: '2.5rem' }} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} required disabled={saving} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="input-label">Biography *</label>
                  <textarea className="input-field" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe your expertise..." required disabled={saving} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ padding: '0.75rem 2rem' }} disabled={saving}>
                {saving ? <Loader size={18} className="spinner" /> : 'Save Changes'}
              </button>
            </div>
          </form>

          <aside className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}><Award size={18} color="var(--accent)" /><h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Skills</h3></div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add skills for AI matchmaking.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {profile?.skills.map(sk => (
                <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', background: 'var(--accent-glow)', border: '1px solid rgba(250,89%,65%,0.3)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {sk.name}
                  <button onClick={() => handleRemoveSkill(sk.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--danger)', padding: 0 }}><X size={14} /></button>
                </div>
              ))}
              {(!profile?.skills || profile.skills.length === 0) && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '1rem 0' }}>No skills added.</div>}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Add Skill</h4>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select className="input-field" value={newSkillId} onChange={(e) => setNewSkillId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">-- Choose --</option>
                  {availableSkills.filter(sk => !profile?.skills.some(ps => ps.id === sk.id)).map(sk => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
                </select>
                <button onClick={handleAddSkill} disabled={!newSkillId} className="btn btn-primary" style={{ padding: '0.75rem' }}><Plus size={16} /></button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </ExpertLayout>
  );
};
