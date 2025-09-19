// Test script to verify Firestore rules
// Run this in browser console when logged in as employee

async function testMessageAccess() {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log('❌ User not authenticated');
    return;
  }
  
  console.log('✅ User authenticated:', user.email);
  
  try {
    // Test reading messages
    const messagesRef = firebase.firestore().collection('messages');
    const snapshot = await messagesRef.limit(1).get();
    console.log('✅ Can read messages collection');
    
    // Test writing a message
    await messagesRef.add({
      fromUserId: user.uid,
      fromUserName: 'Test User',
      content: 'Test message',
      sentAt: firebase.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      type: 'broadcast'
    });
    console.log('✅ Can write to messages collection');
    
  } catch (error) {
    console.log('❌ Firestore permission error:', error);
  }
}

// Run the test
testMessageAccess();