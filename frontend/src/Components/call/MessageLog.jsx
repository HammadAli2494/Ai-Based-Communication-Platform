export default function MessageLog({ messages }) {
  return (
    <section className="message-log">
      <h3>Chat</h3>
      {messages.length === 0 ? (
        <p className="message-log-empty">Messages will appear here.</p>
      ) : (
        <div className="message-log-list">
          {messages.map((message, index) => (
            <p key={index} className="message-log-item">
              {message}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
