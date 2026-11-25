import {
  useId,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  type KeyboardEvent,
} from "react";
import type { GeocodingResult } from "../../api/types";
import { citySearchReducer, initialState } from "./citySearchReducer";
import { useCitySearch } from "./useCitySearch";

interface CitySearchProps {
  onSelect: (city: GeocodingResult) => void;
  selectedCity?: GeocodingResult | null;
}

function getCityLabel(city: GeocodingResult): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

export function CitySearch({ onSelect, selectedCity }: CitySearchProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const listboxRef = useRef<HTMLUListElement>(null);
  const [state, dispatch] = useReducer(citySearchReducer, initialState);
  const { term, selectedLabel, isOpen, activeIndex } = state;
  const { results, isDebouncing, isFetching, isError, isSuccess, refetch } =
    useCitySearch(term);

  const canSearch = term.trim().length >= 2;
  const showPopup = isOpen && canSearch;
  const showResults =
    showPopup && !isDebouncing && !isFetching && !isError && results.length > 0;
  // Screen readers can follow the highlighted option while focus stays on the input.
  const activeOptionId =
    showResults && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  useEffect(() => {
    // Browser navigation can change the selected city outside this component.
    dispatch({
      type: "selected",
      label: selectedCity ? getCityLabel(selectedCity) : null,
    });
  }, [selectedCity]);

  // Adjust the scroll position after rendering but before the browser paints.
  useLayoutEffect(() => {
    const listbox = listboxRef.current;
    const option = listbox?.children.item(activeIndex);
    if (!showResults || !listbox || !option) {
      return;
    }

    // Measure the visible list area and the active option.
    const listboxTop = listbox.getBoundingClientRect().top + listbox.clientTop;
    const listboxBottom = listboxTop + listbox.clientHeight;
    const optionRect = option.getBoundingClientRect();

    // Scroll only enough to bring an out-of-view option into the list.
    if (optionRect.top < listboxTop) {
      listbox.scrollTop += optionRect.top - listboxTop;
    } else if (optionRect.bottom > listboxBottom) {
      listbox.scrollTop += optionRect.bottom - listboxBottom;
    }
  }, [state, activeIndex, showResults, results]);

  function selectCity(city: GeocodingResult) {
    dispatch({ type: "selected", label: getCityLabel(city) });
    onSelect(city);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      dispatch({
        type: "moveActive",
        direction: "next",
        resultCount: results.length,
      });
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      dispatch({
        type: "moveActive",
        direction: "previous",
        resultCount: results.length,
      });
    } else if (
      event.key === "Enter" &&
      activeIndex >= 0 &&
      results[activeIndex]
    ) {
      event.preventDefault();
      selectCity(results[activeIndex]);
    } else if (event.key === "Escape") {
      dispatch({ type: "closed" });
    }
  }

  return (
    <div
      className="relative w-full"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        // Keep the popup open when focus moves to its retry button.
        if (
          nextTarget instanceof Node &&
          event.currentTarget.contains(nextTarget)
        ) {
          return;
        }

        dispatch({ type: "closed" });
      }}
    >
      <label
        className="mb-1 block text-sm font-medium text-slate-700"
        htmlFor={inputId}
      >
        Search city
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showPopup}
        aria-controls={showResults ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
        value={selectedLabel ?? term}
        onChange={(event) => {
          dispatch({
            type: "inputChanged",
            term: event.currentTarget.value,
          });
        }}
        onFocus={() => dispatch({ type: "opened" })}
        onKeyDown={handleKeyDown}
      />

      {showPopup && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          {(isDebouncing || isFetching) && (
            <p className="px-2 py-1 text-sm text-slate-600" role="status">
              Searching cities...
            </p>
          )}

          {isError && !isFetching && (
            <div className="flex items-center justify-between gap-3 px-2 py-1">
              <p className="text-sm text-red-700" role="alert">
                City search failed.
              </p>
              <button
                className="rounded px-2 py-1 text-sm font-medium text-sky-800 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-700"
                type="button"
                onClick={() => {
                  void refetch();
                }}
              >
                Retry
              </button>
            </div>
          )}

          {showResults && (
            <ul
              className="max-h-60 overflow-y-auto"
              id={listboxId}
              ref={listboxRef}
              role="listbox"
            >
              {results.map((city, index) => (
                <li
                  aria-selected={activeIndex === index}
                  className="cursor-pointer rounded px-2 py-2 text-sm hover:bg-slate-100 aria-selected:bg-sky-50"
                  id={`${listboxId}-option-${index}`}
                  key={city.id}
                  role="option"
                  // Keep focus on the input until the click selects the option.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCity(city)}
                >
                  {getCityLabel(city)}
                </li>
              ))}
            </ul>
          )}

          {isSuccess &&
            !isDebouncing &&
            !isFetching &&
            !isError &&
            results.length === 0 && (
              <p className="px-2 py-1 text-sm text-slate-600" role="status">
                No cities found.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
