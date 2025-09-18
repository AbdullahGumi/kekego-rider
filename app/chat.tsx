import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

const messages = [
  { id: "1", text: "Hello, I’m on my way!", sender: "driver" },
  {
    id: "2",
    text: "Great, I’ll be waiting at the pickup point.",
    sender: "me",
  },
  { id: "3", text: "ETA is around 5 minutes.", sender: "driver" },
];

const ChatScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // keeps input above keyboard
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Driver Chat</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.sender === "me" ? styles.myMessage : styles.driverMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.sender === "me"
                    ? styles.myMessageText
                    : styles.driverMessageText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <Ionicons name="happy-outline" size={24} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity>
            <Ionicons name="send" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb", // background behind notch
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: "75%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  driverMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
  },
  messageText: {
    fontSize: 15,
  },
  myMessageText: {
    color: "#fff",
  },
  driverMessageText: {
    color: "#111",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    fontSize: 15,
    color: "#111",
  },
});
