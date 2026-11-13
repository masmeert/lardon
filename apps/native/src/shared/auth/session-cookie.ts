import { createContext } from "react";

export const SessionCookieContext = createContext<Promise<string>>(Promise.resolve(""));
