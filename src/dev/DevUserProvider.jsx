import React from "react";

export const DevUserProvider = ({ children }) => {
  if (process.env.NODE_ENV !== "production") {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        const devUser = {
          googleId: "dev-000",
          name: "Dev User",
          email: "dev@example.com",
          picture: "",
          isSubscribed: false,
          isAdmin: false,
          grade: 11
        };
        localStorage.setItem("user", JSON.stringify(devUser));
      } else {
        const user = JSON.parse(raw);
        if (user.grade === undefined) {
          user.grade = 11;
          localStorage.setItem("user", JSON.stringify(user));
        }
      }
    } catch (e) {}
  }
  return <>{children}</>;
};

export default DevUserProvider;
