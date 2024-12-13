// /pages/api/getLessonReports.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

  const { className, page = 1, limit = 10 } = req.query;

  if (!className) {
    return res.status(400).json({ error: 'Class name is required.' });
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    return res.status(400).json({ error: 'Invalid pagination parameters.' });
  }

  try {
    const lessonReportsRef = db
      .collection('classes')
      .doc(className)
      .collection('lessonReports')
      .orderBy('date', 'desc');

    // Implementing pagination using cursors
    let query = lessonReportsRef.limit(limitNum);

    if (pageNum > 1) {
      // Fetch all documents up to the start of the current page
      const previousPages = await lessonReportsRef.limit((pageNum - 1) * limitNum).get();
      if (!previousPages.empty) {
        const lastVisible = previousPages.docs[previousPages.docs.length - 1];
        query = lessonReportsRef.startAfter(lastVisible).limit(limitNum);
      }
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No lesson reports found.' });
    }

    const lessonReports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date.toDate().toLocaleDateString(),
        classPictures: data.classPictures || [],
        homeworkURL: data.homeworkURL || '',
        processedData: data.processedData || {},
      };
    });

    return res.status(200).json({ lessonReports });
  } catch (error) {
    console.error('Error fetching lesson reports from Firestore:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
