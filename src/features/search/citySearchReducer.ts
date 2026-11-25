interface CitySearchState {
  term: string;
  selectedLabel: string | null;
  isOpen: boolean;
  activeIndex: number;
}

type CitySearchAction =
  | { type: "inputChanged"; term: string }
  | { type: "opened" }
  | { type: "closed" }
  | { type: "moveActive"; direction: "next" | "previous"; resultCount: number }
  | { type: "selected"; label: string };

export const initialState: CitySearchState = {
  term: "",
  selectedLabel: null,
  isOpen: false,
  activeIndex: -1, // No option is highlighted yet.
};

export function citySearchReducer(
  state: CitySearchState,
  action: CitySearchAction,
): CitySearchState {
  switch (action.type) {
    case "inputChanged":
      return {
        term: action.term,
        selectedLabel: null,
        isOpen: true,
        activeIndex: -1,
      };
    case "opened":
      return { ...state, isOpen: true };
    case "closed":
      return { ...state, isOpen: false, activeIndex: -1 };
    case "moveActive":
      return {
        ...state,
        isOpen: true,
        // Wrap around at either end of the list.
        activeIndex:
          action.direction === "next"
            ? state.activeIndex >= action.resultCount - 1
              ? 0
              : state.activeIndex + 1
            : state.activeIndex <= 0
              ? action.resultCount - 1
              : state.activeIndex - 1,
      };
    case "selected":
      return {
        // Keep the label visible without searching for it again.
        term: "",
        selectedLabel: action.label,
        isOpen: false,
        activeIndex: -1,
      };
  }
}
