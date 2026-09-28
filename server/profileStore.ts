import fs from 'fs';
import path from 'path';

export type CreditBureauOption = 'CIBIL' | 'Experian' | 'Equifax' | 'CRIF' | 'Multiple';
export type GenderOption = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface CustomerProfile {
  userId?: string;
  fullName: string;
  phone: string;
  dob: string;
  pan: string;
  gender: GenderOption;
  creditBureau: CreditBureauOption;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  completedAt?: string;
  updatedAt?: string;
}

// Memory cache of profiles mapped by userId and normalized identifiers
const profileMemoryStore = new Map<string, CustomerProfile>();

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'customer_profiles.json');

/**
 * Initializes and loads persistent customer profiles from server JSON store
 */
function initProfileStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(PROFILES_FILE)) {
      const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.userId) {
              profileMemoryStore.set(item.userId, item);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Profile Store] Initialization note:', err);
  }
}

// Initial load
initProfileStore();

/**
 * Safely persists memory store to server JSON store
 */
function persistProfilesToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(profileMemoryStore.values());
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Profile Store] Persistence write note:', err);
  }
}

/**
 * Checks if a profile meets all mandatory compliance criteria
 */
export function isProfileComplete(profile?: Partial<CustomerProfile> | null): boolean {
  if (!profile) return false;

  const hasName = Boolean(profile.fullName && profile.fullName.trim().length >= 2);
  const cleanPhone = (profile.phone || '').replace(/[^0-9]/g, '');
  const hasPhone = cleanPhone.length >= 10;
  const hasDob = Boolean(profile.dob && profile.dob.trim().length >= 4);

  const cleanPan = (profile.pan || '').trim().toUpperCase();
  const hasValidPan = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan);

  const validGenders: GenderOption[] = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const hasGender = Boolean(profile.gender && validGenders.includes(profile.gender as GenderOption));

  const validBureaus: CreditBureauOption[] = ['CIBIL', 'Experian', 'Equifax', 'CRIF', 'Multiple'];
  const hasBureau = Boolean(profile.creditBureau && validBureaus.includes(profile.creditBureau as CreditBureauOption));

  return Boolean(hasName && hasPhone && hasDob && hasValidPan && hasGender && hasBureau);
}

/**
 * Retrieves profile by user ID or associated email/phone
 */
export function getProfileByUserId(userId: string): CustomerProfile | null {
  if (!userId) return null;
  return profileMemoryStore.get(userId) || null;
}

/**
 * Retrieves profile by email or phone match
 */
export function getProfileByEmailOrPhone(email?: string, phone?: string): CustomerProfile | null {
  const normEmail = email?.trim().toLowerCase();
  const cleanPhone = phone?.replace(/[^0-9]/g, '');

  for (const profile of profileMemoryStore.values()) {
    if (normEmail && profile.email?.trim().toLowerCase() === normEmail) {
      return profile;
    }
    if (cleanPhone && cleanPhone.length >= 10) {
      const pDigits = (profile.phone || '').replace(/[^0-9]/g, '');
      if (pDigits.slice(-10) === cleanPhone.slice(-10)) {
        return profile;
      }
    }
  }

  return null;
}

/**
 * Saves or updates a customer profile
 */
export function saveProfile(userId: string, profile: CustomerProfile): CustomerProfile {
  const existing = profileMemoryStore.get(userId);
  const updated: CustomerProfile = {
    ...(existing || {}),
    ...profile,
    userId,
    pan: profile.pan.trim().toUpperCase(),
    phone: profile.phone.trim(),
    fullName: profile.fullName.trim(),
    updatedAt: new Date().toISOString(),
    completedAt: existing?.completedAt || new Date().toISOString(),
  };

  profileMemoryStore.set(userId, updated);
  persistProfilesToFile();

  return updated;
}

/**
 * Gets all saved profiles
 */
export function getAllProfiles(): CustomerProfile[] {
  return Array.from(profileMemoryStore.values());
}
