import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  or 
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
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'messages'),
        or(
          where('toUserId', '==', user.uid),
          where('type', '==', 'broadcast')
        ),
        orderBy('sentAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messageList: Message[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messageList.push({
          id: doc.id,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          toUserId: data.toUserId,
          toUserName: data.toUserName,
          content: data.content,
          sentAt: data.sentAt.toDate(),
          isRead: data.isRead,
          type: data.type
        });
      });

      setMessages(messageList);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
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