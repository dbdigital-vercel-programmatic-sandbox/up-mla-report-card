import type { CSSProperties } from "react"
import { useState } from "react"

import { SearchIcon } from "./icons"
import styles from "./mla-report-card.module.css"

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

export interface SearchSheetOption<
  Id extends number | string = number | string,
> {
  id: Id
  name: string
  englishName: string
}

interface SearchSheetProps<T extends SearchSheetOption> {
  options: T[]
  topHeading: string
  onSelect: (option: T) => void
}

export function SearchSheet<T extends SearchSheetOption>({
  options,
  topHeading,
  onSelect,
}: SearchSheetProps<T>) {
  const [query, setQuery] = useState("")
  const normalizedQuery = normalizeSearchValue(query)

  return (
    <>
      <div className={styles.searchWrap}>
        <SearchIcon
          className={styles.searchIcon}
          style={
            {
              "--foreground-color": "var(--secondary-color)",
            } as CSSProperties
          }
        />
        <input
          className={styles.searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={topHeading}
        />
        {query ? (
          <button
            type="button"
            className={styles.searchClearButton}
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <span className={styles.searchClearIcon}>×</span>
          </button>
        ) : null}
      </div>

      <div className={styles.sheetList}>
        {options
          .filter((option) => {
            const normalizedName = normalizeSearchValue(option.name)
            const normalizedEnglishName = normalizeSearchValue(
              option.englishName
            )
            const matchesName =
              normalizedName.includes(normalizedQuery) ||
              normalizedQuery.includes(normalizedName)
            const matchesEnglishName =
              normalizedEnglishName.includes(normalizedQuery) ||
              normalizedQuery.includes(normalizedEnglishName)

            if (!normalizedQuery) {
              return true
            }

            return matchesName || matchesEnglishName
          })
          .map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.sheetOption}
              onClick={() => onSelect(option)}
            >
              {option.name}
            </button>
          ))}
      </div>
    </>
  )
}
