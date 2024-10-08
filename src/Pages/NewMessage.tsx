import H1 from "../components/Typography/H1";

const NewMessage = () => {
  return (
    <div>
      <H1>New message</H1>
      <form action="" className="flex flex-col gap-4">
        <input type="text" />
        <input type="text" />
        <textarea name="" id=""></textarea>
      </form>
    </div>
  );
};

export default NewMessage;
