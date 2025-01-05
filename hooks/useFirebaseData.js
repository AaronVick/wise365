// hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirebaseData(collectionName, queryParams, dependencies = []) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const collectionRef = collection(db, collectionName);
        const queryRef = query(collectionRef, ...queryParams);
        const snapshot = await getDocs(queryRef);

        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setData(items);
      } catch (err) {
        setError(err.message);
        console.error(`Error fetching ${collectionName}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, isLoading, error };
}

export function useGoals(userId) {
  return useFirebaseData(
    'goals',
    [
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    ],
    [userId]
  );
}

export function useRecentActivity(userId) {
  return useFirebaseData(
    'conversations',
    [
      where('participants', 'array-contains', userId),
      orderBy('lastUpdatedAt', 'desc'),
      limit(10)
    ],
    [userId]
  );
}