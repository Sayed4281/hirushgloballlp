import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  or,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types';
import { MessageSquare, Inbox, Users } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

const EmployeeMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (user) {
      unsubscribe = setupRealtimeMessages();
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const setupRealtimeMessages = () => {
    if (!user) return;

    console.log('Setting up real-time messages for employee:', user.uid);

    try {
      const q = query(
        collection(db, 'messages'),
        or(
          where('toUserId', '==', user.uid),
          where('type', '==', 'broadcast')
        )
      );

      console.log('Query created for employee messages');

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Received message update, document count:', querySnapshot.size);
        const messageList: Message[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Processing message:', data);
          
          // Handle serverTimestamp properly
          let messageDate;
          if (data.sentAt) {
            if (typeof data.sentAt.toDate === 'function') {
              messageDate = data.sentAt.toDate();
            } else {
              messageDate = new Date(data.sentAt);
            }
          } else {
            messageDate = new Date(); // Fallback to current time
          }
          
          messageList.push({
            id: doc.id,
            fromUserId: data.fromUserId,
            fromUserName: data.fromUserName,
            toUserId: data.toUserId,
            toUserName: data.toUserName,
            content: data.content,
            sentAt: messageDate,
            isRead: data.isRead,
            type: data.type
          });
        });

        console.log('Setting messages for employee, count:', messageList.length);
        
        // Sort messages by date (newest first) - client-side sorting
        messageList.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
        
        setMessages(messageList);
        setLoading(false);
      }, (error) => {
        console.error('Error listening to messages:', error);
        setLoading(false);
      });

      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time messages:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Inbox className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
        <p><strong>User ID:</strong> {user?.uid}</p>
        <p><strong>User Email:</strong> {user?.email}</p>
        <p><strong>Messages Count:</strong> {messages.length}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{message.fromUserName}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">
                      {formatDateTime(message.sentAt)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      message.type === 'broadcast' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {message.type === 'broadcast' ? (
                        <>
                          <Users className="w-3 h-3 mr-1" />
                          Broadcast
                        </>
                      ) : (
                        'Direct Message'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{message.content}</p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No messages received yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeMessages;