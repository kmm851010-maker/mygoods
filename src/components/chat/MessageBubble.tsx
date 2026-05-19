import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-orange-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5">{formatTime(message.created_at)}</span>
      </div>
    </div>
  );
}
