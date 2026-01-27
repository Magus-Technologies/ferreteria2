import { create } from "zustand";

type UseStoreQuickFilterProps = {
  quickFilter: string;
  setQuickFilter: (value: string) => void;
};

export const useStoreQuickFilter = create<UseStoreQuickFilterProps>((set) => ({
  quickFilter: "",
  setQuickFilter: (value) => set({ quickFilter: value }),
}));
