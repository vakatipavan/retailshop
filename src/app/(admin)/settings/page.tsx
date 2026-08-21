'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Save, Pencil, X, Store, Phone, MapPin, Receipt } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    gstNumber: ''
  });
  const [draft, setDraft] = useState({ ...settings });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
          setDraft(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });

      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        setDraft(saved);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleCancel = () => {
    setDraft({ ...settings }); // revert unsaved changes
    setIsEditing(false);
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    border: isEditing ? '2px solid var(--primary-color)' : '1px solid transparent',
    backgroundColor: isEditing ? 'white' : '#F9FAFB',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical' as const,
  };

  return (
    <div>
      <Header title="Settings" />

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {message.text && (
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontWeight: 500,
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Card Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>Store Details</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                These details appear on printed receipts for your customers.
              </p>
            </div>
            {!loading && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  background: 'var(--primary-color)', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <Pencil size={15} /> Edit Settings
              </button>
            )}
          </div>

          {/* Fields */}
          <div style={{ padding: '1.75rem 1.5rem' }}>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Store size={14} /> Store Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="storeName"
                      style={fieldStyle}
                      placeholder="e.g. SuperMart"
                      value={draft.storeName}
                      onChange={handleChange}
                      autoFocus
                    />
                  ) : (
                    <p style={{ padding: '0.75rem 1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500 }}>
                      {settings.storeName || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not set</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <MapPin size={14} /> Store Address
                  </label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      style={fieldStyle}
                      placeholder="123 Main Street, City, State, ZIP"
                      value={draft.address}
                      onChange={handleChange}
                      rows={3}
                    />
                  ) : (
                    <p style={{ padding: '0.75rem 1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                      {settings.address || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not set</span>}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Phone size={14} /> Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="phone"
                        style={fieldStyle}
                        placeholder="+91 9876543210"
                        value={draft.phone}
                        onChange={handleChange}
                      />
                    ) : (
                      <p style={{ padding: '0.75rem 1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '0.95rem' }}>
                        {settings.phone || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Receipt size={14} /> GST / Tax Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="gstNumber"
                        style={fieldStyle}
                        placeholder="22AAAAA0000A1Z5"
                        value={draft.gstNumber}
                        onChange={handleChange}
                      />
                    ) : (
                      <p style={{ padding: '0.75rem 1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 500 }}>
                        {settings.gstNumber || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'inherit', fontWeight: 400 }}>Not set</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons — only visible in edit mode */}
                {isEditing && (
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                    <button
                      onClick={handleCancel}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.7rem 1.5rem',
                        background: 'white', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.7rem 1.75rem',
                        background: saving ? '#A5B4FC' : 'var(--primary-color)',
                        color: 'white', border: 'none', borderRadius: '8px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: 600, fontSize: '0.9rem'
                      }}
                    >
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
