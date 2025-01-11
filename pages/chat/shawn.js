// pages/chat/shawn.js
import { useAuth } from '../../contexts/AuthContext';
import ChatWithShawn from '../../components/ChatWithShawn';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ShawnChatPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen">
      <ChatWithShawn currentUser={currentUser} />
    </div>
  );
}