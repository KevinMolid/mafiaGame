import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";

import { Link } from "react-router-dom";
const NotFound = () => {
  return (
    <Main>
      <div className="max-w-[350px] h-full flex flex-col justify-center mx-auto mb-auto pb-60 text-center">
        <H1>
          <strong className="text-7xl">404</strong>
        </H1>
        <H2>Ooops! Siden finnes ikke.</H2>
        <p className="mb-4">Sjekk at URL-lenken stemmer!</p>
        <p className="mb-4">
          <small>
            Dersom du har kommet hit som følge av en feil i spillet, ta gjerne
            kontakt via{" "}
            <Link
              className="text-neutral-200 hover:underline font-medium"
              to={"/support"}
            >
              Support
            </Link>
            .
          </small>
        </p>

        <p>
          Tilbake til{" "}
          <Link
            className="text-neutral-200 hover:underline font-medium"
            to={"/"}
          >
            Den siste Don
          </Link>
          .
        </p>
      </div>
    </Main>
  );
};

export default NotFound;
