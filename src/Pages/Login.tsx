// React
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Firebaase
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Components
import H1 from "../components/Typography/H1";
import Button from "../components/Button";

const Login = () => {
  const auth = getAuth();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (userData) {
      navigate("/");
      return;
    }
  }, [userData, navigate]);

  /* Handle input fields */
  function handleEmailChange(event: any) {
    setEmail(event.target.value);
  }

  function handlePwChange(event: any) {
    setPassword(event.target.value);
  }

  /* Handle Login*/
  function logIn() {
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
      setError(error.code);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <H1>Log in</H1>
      <form action="" className="flex flex-col gap-2">
        <div className="flex flex-col">
          <label htmlFor="email">Email</label>
          <input
            className="bg-neutral-800 px-2 py-1"
            id="email"
            type="text"
            onChange={handleEmailChange}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="pw">Password</label>
          <input
            className="bg-neutral-800 px-2 py-1"
            id="pw"
            type="password"
            onChange={handlePwChange}
          />
        </div>
        {error && <span className="text-red-500">{error}</span>}
      </form>
      <Button onClick={logIn}>Log in</Button>
      <p className="text-stone-400">
        Dont have an account?{" "}
        <Link to="/signup">
          <span className="text-white hover:underline">Sign up here!</span>
        </Link>
      </p>
    </div>
  );
};

export default Login;
