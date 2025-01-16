# Firebase Usage Analysis

## Collections Found
- agentData
- agents
- agentsDefined
- conversationNames
- conversations
- errorSolutions
- formData
- formExamples
- formRequirements
- funnelData
- funnels
- goals
- projectNames
- resources
- resourcesData
- suggestedGoals
- users

## Files with Firebase Queries

### components/ChatInterface.js
- Line 149: uid userId

### components/ChatWithShawn.js
- Line 83: userId user.uid

### components/DashboardContent.js
- Line 377: userId currentUser.authenticationID

### components/FunnelProgressionHandler.js
- Line 200: userId userId
- Line 210: userId userId
- Line 222: userId userId

### components/ProgressAnalyzer.js
- Line 54: userId userId
- Line 65: userId userId

### components/toolComponents/FormChatContext.js
- Line 98: userId currentUser.uid

### components/toolComponents/FormChatInterface.js
- Line 67: userId userId

### components/toolComponents/buyer-persona.js
- Line 52: userId currentUser.uid

### components/toolComponents/positioning-factors.js
- Line 50: userId currentUser.uid

### components/toolComponents/success-wheel.js
- Line 49: userId currentUser.uid

### hooks/useFirebaseData.js
- Line 45: userId userId

### lib/dashboardTools.js
- Line 39: userId currentUser.uid
- Line 140: userId currentUser.uid
- Line 209: userId currentUser.uid
- Line 334: userId currentUser.uid
- Line 382: userId userId
- Line 407: userId userId

### pages/admin/login.js
- Line 49: authenticationID userCredential.user.uid

### pages/api/analyze-chat-history.js
- Line 21: from userId

### pages/api/verify-admin.js
- Line 33: authenticationID decodedToken.uid

### pages/dashboard.js
- Line 75: userId user.uid

### pages/goals.js
- Line 53: userId localStorage.getItem('userId'
