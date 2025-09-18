import { riderApi } from "@/api/endpoints/rider";
import { COLORS } from "@/constants/Colors";
import { useAppStore } from "@/stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { GiftedChat, IMessage } from "react-native-gifted-chat";

const ChatScreen = () => {
  const {
    rideState: { rideId, driver },
    user,
    messages,
    setMessages,
    socketRef,
  } = useAppStore();

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      socketRef?.current?.emit("message:send", {
        rideId,
        content: newMessages[0].text,
      });
    },
    [rideId, socketRef]
  );

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await riderApi.getRideMessages(rideId!);
        if (res.data.success) {
          setMessages(
            res.data.data.messages
              .map((m: any) => ({
                ...m,
                createdAt: new Date(m.createdAt),
              }))
              .reverse()
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    if (rideId) fetchMessages();
  }, [rideId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Custom Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 0.5,
          borderBottomColor: "#ddd",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#111" }}>
            {driver?.name}
          </Text>
        </View>
      </View>

      {/* GiftedChat */}
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: user?.id ?? "me",
          name: user?.name ?? "You",
        }}
        placeholder="Type a message..."
        alwaysShowSend
        renderSend={(props) => (
          <TouchableOpacity
            style={{ marginRight: 10, marginBottom: 5 }}
            onPress={() => props.onSend?.({ text: props.text!.trim() }, true)}
          >
            <Ionicons name="send" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
