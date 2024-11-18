import Main from "../../components/Main";
import Button from "../../components/Button";

const Styles = () => {
  return (
    <Main>
      <div className="flex gap-2 flex-wrap">
        <Button>Test</Button>
        <Button style="secondary">Test</Button>
        <Button style="black">Test</Button>
        <Button style="danger">Test</Button>
        <Button style="help">Test</Button>
        <Button style="helpActive">Test</Button>
        <Button style="exit">Test</Button>
      </div>
    </Main>
  );
};

export default Styles;
