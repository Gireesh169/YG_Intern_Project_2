import Message from "./Message";

function DateDivider({ label, isDark = false }) {
    return (
        <div className="text-center my-4">
            <span
                className="px-3 py-1 text-xs rounded-full"
                style={{
                    background: isDark ? "rgba(51,65,85,0.8)" : "#E2E8F0",
                    color: isDark ? "#CBD5E1" : "#475569",
                }}
            >
                {label}
            </span>
        </div>
    );
}

export default function ChatMessageList({
    messages,
    currentUserId,
    onDelete,
    onEditSelect,
    isDark = false,
}) {
    const formatChatDate = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();

        const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const diff =
            (todayDate - msgDate) / (1000 * 60 * 60 * 24);

        if (diff === 0) return "Today";
        if (diff === 1) return "Yesterday";
        if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });

        return d.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };


    return (
        <>
            {messages.map((msg, index) => {
                const showDate =
                    index === 0 ||
                    formatChatDate(messages[index - 1].created_at) !==
                    formatChatDate(msg.created_at);

                return (
                    <div key={msg.id}>
                        {showDate && <DateDivider label={formatChatDate(msg.created_at)} isDark={isDark} />}

                        <Message
                            msg={msg}
                            currentUserId={currentUserId}
                            onDelete={onDelete}
                            onEdit={(msg) => onEditSelect?.(msg)}
                            isDark={isDark}
                        />
                    </div>
                );
            })}
        </>
    );
}
