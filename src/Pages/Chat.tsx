import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";

const Chat = () => {
  return (
    <section className="h-full pb-16">
      <H1>Chat</H1>
      <div className="grid grid-cols-[1fr_4fr] h-full">
        <div className="h-full bg-neutral-800 p-4">
          <H2>Channels</H2>
          <ul>
            <li>
              <p className="text-lg text-white">Players</p>
            </li>
            <li>
              <p>[Username1]</p>
            </li>
          </ul>
          <ul>
            <li>
              <p className="text-lg text-white">Groups</p>
            </li>
            <li>
              <p>[Family]</p>
              <p>[Gang]</p>
            </li>
          </ul>
        </div>
        <div
          id="right_panel"
          className="grid grid-rows-[min-content_auto_min-content] p-4"
        >
          <div id="right_panel_heading" className="border-b">
            <H2>[Current channel]</H2>
          </div>
          <div id="messages_div"></div>
          <div id="new_message_div">
            <form
              action=""
              className="bg-neutral-800 grid grid-cols-[auto_min-content] rounded-lg pr-2"
            >
              <textarea
                name=""
                id=""
                className="w-full resize-none bg-inherit rounded-lg"
              ></textarea>
              <div id="icons" className="flex">
                <div
                  id="send_icon"
                  className="w-8 flex justify-center items-center hover:text-white hover:cursor-pointer"
                >
                  <i className=" text-xl fa-solid fa-paper-plane"></i>
                </div>
                <div
                  id="send_icon"
                  className="w-8 flex justify-center items-center hover:text-white hover:cursor-pointer"
                >
                  <i className="fa-solid fa-face-smile"></i>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chat;
