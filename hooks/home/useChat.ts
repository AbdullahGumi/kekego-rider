import { chatApi } from "@/api/endpoints/chat";
import { Message } from "@/types/home";
import { logError } from "@/utility";
import { BottomSheetFlatListMethods } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { RefObject, useCallback, useEffect, useState } from "react";
import { Alert, Keyboard } from "react-native";

export const useChat = (
  stage: string,
  rideId: string | null,
  flatListRef: RefObject<BottomSheetFlatListMethods | null>
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (stage !== "chat" || !rideId) return;
    const fetchMessages = async () => {
      setChatLoading(true);
      try {
        const response = await chatApi.getMessages(rideId);
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid messages response format");
        }
        setMessages(response.data);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      } catch (error) {
        logError("Fetch Messages", error);
        Alert.alert("Error", "Failed to load chat messages. Please try again.");
        setMessages([]);
      } finally {
        setChatLoading(false);
      }
    };
    fetchMessages();
  }, [stage, rideId, flatListRef]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !rideId) return;
    setChatLoading(true);
    try {
      await chatApi.sendMessage(rideId, { content: newMessage });
      setNewMessage("");
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      logError("Send Message", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }, [newMessage, rideId]);

  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    chatLoading,
    handleSendMessage,
  };
};
