"use client";

import { useGetChatMessages } from "@/api/chats.api";
import { Chat } from "@/features/chat";
import type { ChatUIMessage } from "@/features/chat/chat.types";

interface ResizableChatLayoutProps {
  id: string;
}

export function ResizableChatLayout({ id }: ResizableChatLayoutProps) {
  const { data: chatMessages, isLoading } = useGetChatMessages({
    param: { id },
    query: { limit: "100" },
  });

  return (
    <Chat
      id={id}
      initialChatModel="gpt-4o-mini"
      initialMessages={chatMessages ? (chatMessages as ChatUIMessage[]) : []}
    />
  );
}
