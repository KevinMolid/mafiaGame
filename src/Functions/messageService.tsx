import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore();

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

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
