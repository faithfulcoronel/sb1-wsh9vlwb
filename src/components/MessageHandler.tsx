import React from 'react';
import { create } from 'zustand';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

type MessageType = 'success' | 'error' | 'info' | 'warning';

type Message = {
  type: MessageType;
  text: string;
  duration?: number;
};

type MessageStore = {
  messages: Message[];
  addMessage: (message: Message) => void;
  removeMessage: (index: number) => void;
};

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  addMessage: (message) => {
    const id = Date.now();
    set((state) => ({
      messages: [...state.messages, message],
    }));

    if (message.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          messages: state.messages.filter((_, i) => i !== state.messages.length - 1),
        }));
      }, message.duration || 3000);
    }
  },
  removeMessage: (index) =>
    set((state) => ({
      messages: state.messages.filter((_, i) => i !== index),
    })),
}));

const MessageIcon = ({ type }: { type: MessageType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-400" />;
  }
};

const getMessageStyles = (type: MessageType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 text-green-800';
    case 'error':
      return 'bg-red-50 text-red-800';
    case 'warning':
      return 'bg-yellow-50 text-yellow-800';
    case 'info':
      return 'bg-blue-50 text-blue-800';
  }
};

export function MessageHandler() {
  const { messages, removeMessage } = useMessageStore();

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 min-w-[320px] max-w-md pointer-events-none">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`rounded-md p-4 ${getMessageStyles(message.type)} shadow-lg transition-all duration-300 ease-in-out pointer-events-auto`}
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <MessageIcon type={message.type} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <div className="ml-3">
              <button
                className="inline-flex rounded-md bg-transparent text-current hover:opacity-75 focus:outline-none"
                onClick={() => removeMessage(index)}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}