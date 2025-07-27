import React from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

const HideKeyboardOnTouch = ({ children }: { children: React.ReactNode }) => {
  if (!children) {
    console.warn("HideKeyboardOnTouch received undefined children");
    return null; // or return a fallback UI
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export default HideKeyboardOnTouch;
