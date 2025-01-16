// pages/api/track-suggestion.js
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, suggestionType, suggestionTitle, timestamp } = req.body;

    if (!userId || !suggestionType || !suggestionTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Add interaction to history
    await addDoc(collection(db, 'suggestionInteractions'), {
      userId,
      suggestionType,
      suggestionTitle,
      timestamp: serverTimestamp(),
      clientTimestamp: timestamp
    });

    // Update suggestion metrics
    const metricsRef = doc(db, 'suggestionMetrics', suggestionTitle);
    const metricsDoc = await getDoc(metricsRef);

    if (metricsDoc.exists()) {
      // Update existing metrics
      await updateDoc(metricsRef, {
        clickCount: increment(1),
        lastClicked: serverTimestamp()
      });
    } else {
      // Create new metrics document with specific ID
      await setDoc(metricsRef, {
        suggestionTitle,
        suggestionType,
        clickCount: 1,
        firstClicked: serverTimestamp(),
        lastClicked: serverTimestamp()
      });
    }

    // Update user metrics
    const userMetricsRef = doc(db, 'userMetrics', userId);
    const userMetricsDoc = await getDoc(userMetricsRef);

    if (userMetricsDoc.exists()) {
      await updateDoc(userMetricsRef, {
        [`suggestionClicks.${suggestionType}`]: increment(1),
        lastSuggestionInteraction: serverTimestamp()
      });
    } else {
      // Create new user metrics document with specific ID
      await setDoc(userMetricsRef, {
        userId,
        suggestionClicks: {
          [suggestionType]: 1
        },
        lastSuggestionInteraction: serverTimestamp()
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking suggestion:', error);
    return res.status(500).json({ error: 'Failed to track suggestion' });
  }
}