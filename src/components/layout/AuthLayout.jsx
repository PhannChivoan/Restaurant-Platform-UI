import { Outlet } from "react-router-dom";
import { getAccessToken, removeAccessToken } from "../../store/access_token";

const AuthLayout = () => {
  const accessToken = getAccessToken();
  if (accessToken) {
    removeAccessToken();
    localStorage.removeItem("profile");
  }
  return <Outlet />;
};

export default AuthLayout;
