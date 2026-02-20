import { useCallback } from "react";
import type { ChatUIMessage } from "@/features/chat/chat.types";

type UseChatHandlersProps = {
  messages: ChatUIMessage[];
  setMessages: (
    messages: ChatUIMessage[] | ((messages: ChatUIMessage[]) => ChatUIMessage[])
  ) => void;
  setInput: (input: string) => void;
  setSelectedModel: (model: string) => void;
  selectedModel: string;
  chatId: string | null;
  /** Pass the setDraftValue from the parent useChatDraft to avoid creating a duplicate instance */
  setDraftValue?: (value: string) => void;
};

export function useChatHandlers({
  messages,
  setMessages,
  setInput,
  setSelectedModel,
  selectedModel,
  chatId,
  setDraftValue,
}: UseChatHandlersProps) {
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      setDraftValue?.(value);
    },
    [setInput, setDraftValue]
  );

  const handleModelChange = useCallback(
    async (model: string) => {
      setSelectedModel(model);
    },
    [setSelectedModel]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setMessages((prev: ChatUIMessage[]) => prev.filter((message) => message.id !== id));
    },
    [setMessages]
  );

  const handleEdit = useCallback(
    (id: string, newText: string) => {
      setMessages((prev: ChatUIMessage[]) =>
        prev.map((message) => (message.id === id ? { ...message, content: newText } : message))
      );
    },
    [setMessages]
  );

  return {
    handleInputChange,
    handleModelChange,
    handleDelete,
    handleEdit,
  };
}
