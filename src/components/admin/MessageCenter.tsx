import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Message, Employee } from '../../types';
import { Send, MessageSquare, Users, AlertCircle } from 'lucide-react';

const MessageCenter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
  Promise.all([fetchMessages(), fetchEmployees()]).finally(() => setLoading(false));
  }, []);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('sentAt', 'desc'));
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
          sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : new Date(),
          isRead: data.isRead,
          type: data.type
        });
      });
      setMessages(messageList);
    } catch (error: any) {
      setError(error.message || 'Error fetching messages');
    }
  };

  const fetchEmployees = async () => {
    try {
      const q = query(collection(db, 'employees'), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      const employeeList: Employee[] = [];
      querySnapshot.forEach((doc) => {
        employeeList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        } as Employee);
      });
      setEmployees(employeeList);
    } catch (error: any) {
      setError(error.message || 'Error fetching employees');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    setError('');

    try {
      const messageData = {
        fromUserId: user.uid,
        fromUserName: user.name || 'Admin',
        content: newMessage.trim(),
        sentAt: new Date(),
        isRead: false,
        type: selectedEmployee === 'all' ? 'broadcast' : 'direct'
      };

      if (selectedEmployee === 'all') {
        // Broadcast message
        await addDoc(collection(db, 'messages'), messageData);
      } else {
        // Direct message
        const selectedEmp = employees.find(emp => emp.id === selectedEmployee);
        await addDoc(collection(db, 'messages'), {
          ...messageData,
          toUserId: selectedEmployee,
          toUserName: selectedEmp?.name
        });
      }

      setNewMessage('');
      setSelectedEmployee('all');
      await fetchMessages();
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">Loading...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-center">{error}</div>
      )}
      {/* Send Message Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Message</h2>
        
        <form onSubmit={sendMessage} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Type your message here..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      </div>

      {/* Message History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Message History</h2>
        
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{message.fromUserName}</p>
                    <p className="text-sm text-gray-600">
                      To: {message.type === 'broadcast' ? 'All Employees' : message.toUserName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{message.sentAt.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    message.type === 'broadcast' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {message.type === 'broadcast' ? 'Broadcast' : 'Direct'}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{message.content}</p>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages sent yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;