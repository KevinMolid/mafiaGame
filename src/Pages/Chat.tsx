import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";

const Chat = () => {
  return (
    <section className="h-full">
      <H1>Chat</H1>
      <div className="grid grid-cols-[1fr_3fr] h-full">
        <div className="h-full bg-neutral-800 p-4">
          <H2>Channels</H2>
          <ul>
            <li>
              <p className="text-lg text-white">Users</p>
              <p>Test</p>
            </li>
          </ul>
        </div>
        <div className="p-4">
          <H2>[Current channel]</H2>
        </div>
      </div>
    </section>
  );
};

export default Chat;
