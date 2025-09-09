import CustomText from "@/components/common/CustomText";
import { Message } from "@/types/home";
import React, { memo } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { homeStyles } from "../../../styles/home-styles";

interface MessageItemProps {
  item: Message;
  userId: string;
}

const MessageItem = memo<MessageItemProps>(({ item, userId }) => (
  <Animated.View
    entering={FadeIn}
    style={[
      homeStyles.messageBubble,
      item.senderId === userId
        ? homeStyles.sentMessage
        : homeStyles.receivedMessage,
    ]}
  >
    <CustomText fontWeight="Medium" style={homeStyles.messageSender}>
      {item.senderId === userId ? "You" : item.Sender?.name || "Unknown"}
    </CustomText>
    <CustomText style={homeStyles.messageText}>{item.content}</CustomText>
    <CustomText style={homeStyles.messageTime}>
      {new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </CustomText>
  </Animated.View>
));

MessageItem.displayName = "MessageItem";

export default MessageItem;
