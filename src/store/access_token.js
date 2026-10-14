const getAccessToken = () => {
  const token = localStorage.getItem("auth_token");

  if (!token) return null;

  try {
    return JSON.parse(token);
  } catch {
    return token;
  }
};

const setAccessToken = (token) => {
  localStorage.setItem("auth_token", JSON.stringify(token));
};

const removeAccessToken = () => {
  localStorage.removeItem("auth_token");
};

export const setProfile = (value) => {
  localStorage.setItem("profile", JSON.stringify(value));
};

export const getProfile = () => {
  try {
    const profile = localStorage.getItem("profile");
    if (profile !== "" && profile !== null && profile !== undefined) {
      return JSON.parse(profile);
    }
    return null;
  } catch (error) {
    console.log("Error parsing profile from localStorage: ", error);
    return null;
  }
};

export { getAccessToken, setAccessToken, removeAccessToken };
