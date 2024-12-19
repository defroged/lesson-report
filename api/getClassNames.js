// /api/getClassNames.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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
    const classesSnapshot = await db.collection('classes').get();
    const classNames = classesSnapshot.docs.map(doc => doc.id);
    return res.status(200).json({ classNames });
  } catch (error) {
    console.error('Error fetching class names:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}