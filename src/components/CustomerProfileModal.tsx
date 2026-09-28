import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Phone,
  Calendar,
  CreditCard,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Building,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  ArrowRight,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomerProfile, CreditBureauOption, GenderOption } from '../types';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR',
  'Chandigarh',
  'Other / UT',
];

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  isMandatory = true,
}) => {
  const { user, customerProfile, saveCustomerProfile, logout } = useAuth();

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [pan, setPan] = useState('');
  const [isPanMasked, setIsPanMasked] = useState(false);
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [creditBureau, setCreditBureau] = useState<CreditBureauOption | ''>('CIBIL');

  // Optional Fields
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Pre-fill fields whenever user or customerProfile changes
  useEffect(() => {
    if (!isOpen) return;

    if (customerProfile) {
      setFullName(customerProfile.fullName || '');
      setPhone(customerProfile.phone ? customerProfile.phone.replace(/[^0-9]/g, '').slice(-10) : '');
      setDob(customerProfile.dob || '');
      setPan(customerProfile.pan || '');
      setGender(customerProfile.gender || '');
      setCreditBureau(customerProfile.creditBureau || 'CIBIL');
      setEmail(customerProfile.email || user?.email || '');
      setCity(customerProfile.city || '');
      setState(customerProfile.state || '');
      setPincode(customerProfile.pincode || '');
    } else if (user) {
      if (user.name && user.name !== 'User' && !user.name.includes('User (')) {
        setFullName(user.name);
      }
      if (user.phone) {
        setPhone(user.phone.replace(/[^0-9]/g, '').slice(-10));
      }
      if (user.email) {
        setEmail(user.email);
      }
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen, user, customerProfile]);

  if (!isOpen) return null;

  // Masked display helper for PAN: ABCDE1234F -> ••••••1234
  const formatPanDisplay = (raw: string, mask: boolean) => {
    if (!mask || raw.length <= 4) return raw;
    const last4 = raw.slice(-4);
    const maskedPrefix = '•'.repeat(raw.length - 4);
    return `${maskedPrefix}${last4}`;
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(val);
  };

  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const isPhoneValid = phone.replace(/[^0-9]/g, '').length === 10;
  const isDobValid = Boolean(dob && new Date(dob).getTime() <= Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Mark all required as touched
    setTouched({
      fullName: true,
      phone: true,
      dob: true,
      pan: true,
      gender: true,
      creditBureau: true,
      pincode: true,
    });

    // Validation checks
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full legal name as per PAN record.');
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!dob) {
      setErrorMessage('Please provide your Date of Birth.');
      return;
    }

    if (!isDobValid) {
      setErrorMessage('Please provide a valid past Date of Birth.');
      return;
    }

    if (!isPanValid) {
      setErrorMessage('Invalid Indian PAN format. Format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
      return;
    }

    if (!gender) {
      setErrorMessage('Please select your gender.');
      return;
    }

    if (!creditBureau) {
      setErrorMessage('Please select your target Credit Bureau.');
      return;
    }

    if (pincode && pincode.trim().length !== 6) {
      setErrorMessage('Postal Pincode must be exactly 6 digits if provided.');
      return;
    }

    setIsSubmitting(true);

    const profileData: CustomerProfile = {
      fullName: fullName.trim(),
      phone: `+91 ${phone.replace(/[^0-9]/g, '').slice(-10)}`,
      dob,
      pan: pan.trim().toUpperCase(),
      gender: gender as GenderOption,
      creditBureau: creditBureau as CreditBureauOption,
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
    };

    const res = await saveCustomerProfile(profileData);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Customer profile completed and synced successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Failed to save profile. Please verify your details.');
    }
  };

  return (
    <div
      id="customer-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
      onClick={() => {
        if (!isMandatory && onClose) onClose();
      }}
    >
      <div
        id="customer-profile-modal-container"
        className="relative w-full max-w-2xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-6 py-5 border-b border-indigo-700/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-black shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Mandatory Customer Profile
                  </h2>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wide">
                    Required
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Section 21 CICRA compliance for authentic bureau credit record mapping
                </p>
              </div>
            </div>

            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Security & Verification Banner */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-6 py-2.5 flex items-center gap-2 text-xs text-indigo-900 font-medium">
          <Lock className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
          <span>
            Data is strictly encrypted and synchronized to Digital Katta CRM for official bureau dispute processing.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-bold">{successMessage}</div>
            </div>
          )}

          {/* Section 1: Identity & Bureau Mapping (Mandatory) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Bureau Identity Details (Mandatory)
              </span>
              <span className="text-[11px] text-rose-600 font-bold">* All fields required</span>
            </div>

            {/* Full Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (as on PAN) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-fullname-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                    placeholder="e.g. Rajesh Kumar Sharma"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      touched.fullName && (!fullName.trim() || fullName.trim().length < 2)
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none text-xs font-bold text-slate-500 border-r border-slate-200 pr-2">
                    +91
                  </div>
                  <input
                    id="profile-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    placeholder="9876543210"
                    className={`w-full pl-20 pr-3 py-2 text-sm border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      touched.phone && !isPhoneValid
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth & PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth (DOB) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-dob-input"
                    type="date"
                    value={dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDob(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, dob: true }))}
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      touched.dob && !isDobValid
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    PAN Card Number <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPanMasked(!isPanMasked)}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer transition-colors"
                    title={isPanMasked ? 'Reveal clear PAN' : 'Mask PAN characters'}
                  >
                    {isPanMasked ? (
                      <>
                        <Eye className="w-3 h-3" /> Show PAN
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Mask in UI
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-pan-input"
                    type="text"
                    value={isPanMasked ? formatPanDisplay(pan, true) : pan}
                    onChange={handlePanChange}
                    onFocus={() => {
                      // Automatically unmask when user focuses to edit
                      if (isPanMasked) setIsPanMasked(false);
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, pan: true }));
                      // Mask upon leaving for UI privacy
                      setIsPanMasked(true);
                    }}
                    placeholder="ABCDE1234F"
                    className={`w-full pl-9 pr-16 py-2 text-sm font-mono tracking-wider border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all uppercase ${
                      touched.pan && !isPanValid
                        ? 'border-rose-300 focus:ring-rose-200'
                        : isPanValid
                        ? 'border-emerald-400 focus:ring-emerald-100'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                    maxLength={10}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isPanValid ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Valid PAN
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">10 chars</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Format: 5 uppercase letters, 4 numbers, 1 letter. Masked automatically for privacy.
                </p>
              </div>
            </div>

            {/* Gender & Target Bureau */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="profile-gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderOption)}
                    onBlur={() => setTouched((p) => ({ ...p, gender: true }))}
                    className={`w-full px-3 py-2 text-sm border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 appearance-none pr-8 transition-all ${
                      touched.gender && !gender
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Credit Bureau <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="profile-bureau-select"
                    value={creditBureau}
                    onChange={(e) => setCreditBureau(e.target.value as CreditBureauOption)}
                    onBlur={() => setTouched((p) => ({ ...p, creditBureau: true }))}
                    className={`w-full px-3 py-2 text-sm border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 appearance-none pr-8 transition-all ${
                      touched.creditBureau && !creditBureau
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                    required
                  >
                    <option value="CIBIL">TransUnion CIBIL (Most Popular)</option>
                    <option value="Experian">Experian India</option>
                    <option value="Equifax">Equifax India</option>
                    <option value="CRIF">CRIF High Mark</option>
                    <option value="Multiple">Multiple / Combined Bureaus</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address (Optional) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Contact & Address (Optional)
              </span>
              <span className="text-[11px] text-slate-400">Used for official postal dispute notices</span>
            </div>

            {/* Email & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  City <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-city-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Bangalore"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* State & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  State <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    id="profile-state-select"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 appearance-none pr-8 transition-all"
                  >
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Postal Pincode <span className="text-slate-400 font-normal">(Optional, 6 digits)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-pincode-input"
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="411001"
                    maxLength={6}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {isMandatory ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Account / Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-slate-900 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              id="submit-customer-profile-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 active:bg-black text-white text-sm font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Saving & Syncing Profile...</span>
                </>
              ) : (
                <>
                  <span>Save Profile & Proceed</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
