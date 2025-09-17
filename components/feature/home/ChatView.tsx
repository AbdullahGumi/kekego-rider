import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { Driver } from "@/stores/useAppStore";
import { Message } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../styles/home-styles";
import MessageItem from "./MessageItem";

interface ChatViewProps {
  driver: Driver | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  chatLoading: boolean;
  handleSendMessage: () => void;
  userId?: string;
}

const ChatView = memo<ChatViewProps>(
  ({
    driver,
    messages,
    newMessage,
    setNewMessage,
    chatLoading,
    handleSendMessage,
    userId = "rider1",
  }) => (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Chat with {driver?.name || "Driver"}
      </CustomText>
      {chatLoading ? (
        <View style={homeStyles.chatLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <CustomText style={homeStyles.searchText}>
            Loading messages...
          </CustomText>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            renderItem={({ item }: { item: Message }) => (
              <MessageItem item={item} userId={userId} />
            )}
            keyExtractor={(item: Message) => item.id}
            style={homeStyles.chatList}
            contentContainerStyle={homeStyles.chatListContent}
            showsVerticalScrollIndicator={false}
          />
          <View style={homeStyles.chatInputContainer}>
            <TextInput
              style={homeStyles.chatInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.secondaryText}
              multiline
            />
            <TouchableOpacity
              style={[
                homeStyles.sendButton,
                !newMessage.trim() && homeStyles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || chatLoading}
              activeOpacity={0.7}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </Animated.View>
  )
);

ChatView.displayName = "ChatView";

export default ChatView;
