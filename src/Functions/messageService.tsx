import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore();

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  isOwn?: boolean;
  isRead?: boolean;
};

export const sendMessage = async (
  channelId: string,
  message: string,
  senderId: string,
  senderName: string
) => {
  const messagesRef = collection(db, "Channels", channelId, "Messages");
  try {
    await addDoc(messagesRef, {
      senderId: senderId,
      senderName: senderName,
      text: message,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error sending message: ", err);
  }
};

export const fetchMessages = async (channelId: string): Promise<Message[]> => {
  try {
    const messagesCollection = collection(db, `Channels/${channelId}/Messages`);
    const querySnapshot = await getDocs(messagesCollection);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        timestamp: data.timestamp.toDate(),
      };
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Could not fetch messages");
  }
};
