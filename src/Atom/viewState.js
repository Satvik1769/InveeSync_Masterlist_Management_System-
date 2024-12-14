import { atom } from "recoil";

export const viewState = atom({
  key: "viewState",
  default: true, // Default to showing the Item table
});
