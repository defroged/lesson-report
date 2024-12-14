// /api/getClasses.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newline characters
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const classesRef = db.collection('classes');
    const snapshot = await classesRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No classes found.' });
    }

    const classesList = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.name || doc.id; // fallback to doc id if no name field
    });

    return res.status(200).json({ classes: classesList });
  } catch (error) {
    console.error('Error fetching classes from Firestore:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
