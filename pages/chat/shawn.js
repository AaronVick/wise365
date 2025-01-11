// pages/chat/shawn.js
import { useAuth } from '../../contexts/AuthContext';
import ChatWithShawn from '../../components/ChatWithShawn';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Add this export to disable static generation
export const getServerSideProps = () => {
  return {
    props: {}
  }
}

export default function ShawnChatPage() {
  const { currentUser } = useAuth() || {}; // Add fallback to empty object
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  // Add loading state check
  if (typeof window === 'undefined') {
    return null; // Return null during server-side rendering
  }

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen">
      <ChatWithShawn currentUser={currentUser} />
    </div>
  );
}