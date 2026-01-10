import {
  addDoc,
  collection,
  DocumentReference,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { GeneratedFrame, SavedProject, SubjectCategory } from '../../types';

interface GenerationHistoryInput {
  uid: string;
  frames: GeneratedFrame[];
  styleId: string;
  subjectCategory: SubjectCategory;
  motionPreset: string;
  motionPrompt: string;
  useTurbo: boolean;
  superMode: boolean;
  cutoutMode: boolean;
}

export const saveGenerationHistory = async ({
  uid,
  frames,
  styleId,
  subjectCategory,
  motionPreset,
  motionPrompt,
  useTurbo,
  superMode,
  cutoutMode,
}: GenerationHistoryInput) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  return addDoc(collection(db, 'users', uid, 'generations'), {
    createdAt: serverTimestamp(),
    frames,
    frameCount: frames.length,
    styleId,
    subjectCategory,
    motionPreset,
    motionPrompt,
    useTurbo,
    superMode,
    cutoutMode,
  });
};

interface ProjectSaveInput {
  uid: string;
  project: SavedProject;
}

export const saveProjectToFirestore = async ({ uid, project }: ProjectSaveInput) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  return addDoc(collection(db, 'users', uid, 'projects'), {
    ...project,
    createdAt: serverTimestamp(),
  });
};

interface CheckoutSessionInput {
  uid: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSession = async ({
  uid,
  priceId,
  successUrl,
  cancelUrl,
}: CheckoutSessionInput): Promise<DocumentReference> => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  return addDoc(collection(db, 'customers', uid, 'checkout_sessions'), {
    price: priceId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    mode: 'payment',
    createdAt: serverTimestamp(),
  });
};
