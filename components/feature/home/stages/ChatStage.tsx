import ChatView from "@/components/feature/home/ChatView";
import type { Driver, Message } from "@/types/home";

interface ChatStageProps {
  driver: Driver;
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  chatLoading: boolean;
  handleSendMessage: () => void;
}

const ChatStage: React.FC<ChatStageProps> = ({
  driver,
  messages,
  newMessage,
  setNewMessage,
  chatLoading,
  handleSendMessage,
}) => {
  return (
    <ChatView
      driver={driver}
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      chatLoading={chatLoading}
      handleSendMessage={handleSendMessage}
    />
  );
};

export default ChatStage;
