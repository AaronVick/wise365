// lib/services/firebaseService.js

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit 
} from 'firebase/firestore';

class FirebaseService {
  constructor() {
    this._collections = new Map();
    this._currentUser = null;
    this._initialized = false;
  }

  setCurrentUser(userData) {
    if (!userData) {
      throw new Error('User data is required');
    }
    this._currentUser = userData;
    this._initialized = true;
  }

  async queryCollection(collectionName, params = {}) {
    try {
      if (!this._initialized) {
        throw new Error('Firebase service not initialized');
      }

      if (!collectionName) {
        throw new Error('Collection name is required');
      }

      const queryParams = {
        where: [],
        orderBy: null,
        limit: null,
        ...params
      };

      return this.query(collectionName, queryParams);
    } catch (error) {
      console.error('Error in queryCollection:', error);
      throw error;
    }
  }

  async getFunnelData(userId, funnelName) {
    try {
      if (!userId || !funnelName) {
        throw new Error('Missing required parameters: userId and funnelName are required');
      }

      const data = await this.query('funnelData', {
        where: [
          { field: 'userId', operator: '==', value: userId },
          { field: 'funnelName', operator: '==', value: funnelName }
        ],
        limit: 1
      });
      return data[0] || null;
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      throw error;
    }
  }

  registerCollection(collectionName, config) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('Collection name must be a string');
    }
    
    if (!config || typeof config !== 'object') {
      throw new Error('Collection config must be an object');
    }
  
    if (!config.userIdField) {
      throw new Error(`Collection ${collectionName} config must specify userIdField`);
    }
  
    this._collections.set(collectionName, {
      ...config,
      defaultQueries: config.defaultQueries || []
    });
  }

  async getUserData(userId) {
    try {
      if (!userId) {
        throw new Error('getUserData called with undefined userId');
      }

      const userData = await this.query('users', {
        where: [{ field: 'authenticationID', operator: '==', value: userId }]
      });
      return userData[0] || null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  async getTeamData(teamId) {
    try {
      if (!teamId) {
        throw new Error('getTeamData called with undefined teamId');
      }

      const teamData = await this.query('teams', {
        where: [{ field: 'teamId', operator: '==', value: teamId }]
      });
      return teamData[0] || null;
    } catch (error) {
      console.error('Error fetching team data:', error);
      throw error;
    }
  }

  async query(collectionName, options = {}) {
    try {
      const config = this._collections.get(collectionName);
      if (!config) {
        throw new Error(`Collection ${collectionName} not registered`);
      }

      const queryConstraints = [];
      const usedOrderByFields = new Set();

      if (this._currentUser && this._currentUser[config.userIdField]) {
        queryConstraints.push(where(config.userIdField, '==', this._currentUser[config.userIdField]));
      }

      if (config.useTeamId && this._currentUser?.teamId) {
        queryConstraints.push(where('teamId', '==', this._currentUser.teamId));
      }

      if (options.where) {
        options.where.forEach(({ field, operator, value }) => {
          if (field && operator && value !== undefined) {
            queryConstraints.push(where(field, operator, value));
          }
        });
      }

      if (options.orderBy) {
        const [field, direction] = options.orderBy.split(' ');
        if (!usedOrderByFields.has(field)) {
          queryConstraints.push(orderBy(field, direction || 'asc'));
          usedOrderByFields.add(field);
        }
      }

      if (config.defaultQueries) {
        config.defaultQueries.forEach(constraint => {
          if (constraint.type === 'orderBy') {
            const field = constraint.field || constraint._delegate?.field;
            if (field && !usedOrderByFields.has(field)) {
              queryConstraints.push(constraint);
              usedOrderByFields.add(field);
            }
          } else {
            queryConstraints.push(constraint);
          }
        });
      }

      if (options.limit) {
        queryConstraints.push(limit(options.limit));
      }

      const q = query(collection(db, collectionName), ...queryConstraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error in query for ${collectionName}:`, error);
      throw error;
    }
  }

  async create(collectionName, data) {
    try {
      const config = this._collections.get(collectionName);
      if (!config) throw new Error(`Collection ${collectionName} not registered`);

      if (!this._currentUser) {
        throw new Error('No authenticated user found');
      }

      const docData = {
        ...data,
        [config.userIdField]: this._currentUser[config.userIdField],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (config.useTeamId && this._currentUser?.teamId) {
        docData.teamId = this._currentUser.teamId;
      }

      const docRef = await addDoc(collection(db, collectionName), docData);
      return {
        id: docRef.id,
        ...docData
      };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async update(collectionName, docId, data) {
    try {
      const config = this._collections.get(collectionName);
      if (!config) throw new Error(`Collection ${collectionName} not registered`);

      if (!docId) throw new Error('Document ID is required');

      const docRef = doc(db, collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      return {
        id: docId,
        ...updateData
      };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async delete(collectionName, docId) {
    try {
      if (!docId) throw new Error('Document ID is required');
      
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document in ${collectionName}:`, error);
      throw error;
    }
  }

  async get(collectionName, docId) {
    try {
      if (!docId) throw new Error('Document ID is required');
      
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }
}

const firebaseService = new FirebaseService();

firebaseService.registerCollection('users', {
  userIdField: 'authenticationID',
  defaultQueries: [orderBy('createdAt', 'desc')]
});

firebaseService.registerCollection('teams', {
  userIdField: 'userId',
  useTeamId: true
});

firebaseService.registerCollection('funnelsData', {
  userIdField: 'userId',
  useTeamId: true,
  defaultQueries: [orderBy('timestamp', 'desc')]
});

firebaseService.registerCollection('resourcesData', {
  userIdField: 'authenticationID',
  useTeamId: true,
  defaultQueries: [orderBy('timestamp', 'desc')]
});

firebaseService.registerCollection('resources', {
  userIdField: 'authenticationID',
  useTeamId: true
});

firebaseService.registerCollection('conversations', {
  userIdField: 'authenticationID',
  defaultQueries: [orderBy('timestamp', 'desc')]
});

firebaseService.registerCollection('tasks', {
  userIdField: 'userId',
  useTeamId: true,
  defaultQueries: [orderBy('dueDate', 'asc')]
});

firebaseService.registerCollection('goals', {
  userIdField: 'userId',
  defaultQueries: [orderBy('createdAt', 'desc')]
});

firebaseService.registerCollection('projectNames', {
  userIdField: 'authenticationID',
  useTeamId: true
});

firebaseService.registerCollection('funnelData', {
  userIdField: 'userId',
  useTeamId: true,
  defaultQueries: [orderBy('updatedAt', 'desc')]
});

export default firebaseService;