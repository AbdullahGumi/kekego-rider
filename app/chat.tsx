import { riderApi } from "@/api/endpoints/rider";
import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
  };
}

const ChatScreen = () => {
  const {
    rideState: { rideId, driver },
    user,
    messages,
    setMessages,
    socketRef,
  } = useAppStore();
  
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText(""); // Clear input immediately

    // Emit socket event
    socketRef?.current?.emit("message:send", {
      rideId,
      content,
    });
  }, [inputText, rideId, socketRef]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await riderApi.getRideMessages(rideId!);
        if (res.data.success) {
          setMessages(
            res.data.data.messages
              .map((m: any) => ({
                _id: m._id,
                text: m.text,
                createdAt: new Date(m.createdAt),
                user: {
                    _id: m.user._id,
                    name: m.user.name
                }
              }))
              .reverse()
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (rideId) fetchMessages();
  }, [rideId, setMessages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user._id === (user?.id ?? "me");

    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMyMessage ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
                styles.timeText,
                isMyMessage ? styles.myTimeText : styles.theirTimeText
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={scale(24)} color="#111" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{driver?.name}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <FlatList
          data={messages as unknown as Message[]}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          inverted
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim()}
            style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled
            ]}
          >
            <Ionicons
              name="send"
              size={scale(24)}
              color={!inputText.trim() ? COLORS.secondaryText : COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerSafeArea: {
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
    width: "100%",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#E5E7EB", // Light gray
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.white,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  timeText: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: 'flex-end',
  },
  myTimeText: {
      color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimeText: {
      color: COLORS.secondaryText,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000000", // Force black text
    textAlignVertical: "center",
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary, // Button background is primary
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0, // Align with text input bottom
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
});

export default ChatScreen;
