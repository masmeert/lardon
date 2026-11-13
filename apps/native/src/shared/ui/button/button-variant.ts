import { createContext } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export const ButtonVariantContext = createContext<ButtonVariant>("primary");
