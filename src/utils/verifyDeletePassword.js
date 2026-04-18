import { ADMIN_DELETE_PASSWORD } from "../config/adminDeletePassword";

export const verifyDeletePassword = (password) => {
  if (password !== ADMIN_DELETE_PASSWORD) {
    throw new Error("Incorrect delete password");
  }
  return true;
};
