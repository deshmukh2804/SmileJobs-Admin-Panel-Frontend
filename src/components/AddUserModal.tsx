import React, { useState } from 'react';
import { UserItem } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (user: UserItem) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSaveUser,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [role, setRole] = useState<'Candidate' | 'Employer'>('Candidate');
  const [location, setLocation] = useState('Pune | Mumbai');
  const [status, setStatus] = useState<'Active' | 'Pending' | 'Blocked'>('Active');
  const [verificationStatus, setVerificationStatus] = useState<'Verified' | 'Unverified' | 'Flagged'>('Verified');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newUser: UserItem = {
      id: role === 'Candidate' ? `#CF-${Math.floor(10000 + Math.random() * 90000)}` : `#EMP-${Math.floor(10000 + Math.random() * 90000)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      initials,
      role,
      status,
      joinedDate: 'Today',
      verificationStatus,
      location: location.trim(),
    };

    onSaveUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-variant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant bg-surface-container-low/40">
          <div>
            <h3 className="font-headline-sm text-primary font-bold">
              Add New User / Enterprise Account
            </h3>
            <p className="text-xs text-outline">
              Provision candidate credentials or onboard an enterprise employer profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
              Full Name or Company Name *
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikramaditya Singhania"
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-sm"
              >
                <option value="Candidate">Candidate</option>
                <option value="Employer">Employer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-sm"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Verification
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-sm"
              >
                <option value="Verified">Verified</option>
                <option value="Unverified">Unverified</option>
                <option value="Flagged">Flagged</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
              Base Location / Region
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pune, Maharashtra"
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-sm"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-surface-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all flex items-center gap-1.5 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
