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
        const items = await firebaseService.queryCollection(collectionName, queryParams);
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

export function useGoals(authenticationID) {
  return useFirebaseData(
    'goals',
    [where('userId', '==', authenticationID)],
    [authenticationID]
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