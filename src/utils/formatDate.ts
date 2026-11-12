const THAI_SHORT_MONTHS: readonly string[] = [
  "ม.ค",
  "ก.พ",
  "มี.ค",
  "เม.ย",
  "พ.ค",
  "มิ.ย",
  "ก.ค",
  "ส.ค",
  "ก.ย",
  "ต.ค",
  "พ.ย",
  "ธ.ค"
];

/**
 * Formats a Date or date string into Thai short format: "06 ม.ค 69"
 * Day: 2 digits (e.g. 06)
 * Month: Thai short abbreviation (e.g. ม.ค)
 * Year: 2-digit Buddhist Era (e.g. 2026 + 543 = 2569 -> 69)
 */
export const formatThaiShortDate = (
  dateInput: string | Date | null | undefined
): string => {
  if (!dateInput) return "";

  let year: number;
  let month: number;
  let day: number;

  if (typeof dateInput === "string") {
    const parts = dateInput.split("T")[0].split("-");
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const parsed = new Date(dateInput);
      if (isNaN(parsed.getTime())) return "";
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  } else {
    if (isNaN(dateInput.getTime())) return "";
    year = dateInput.getFullYear();
    month = dateInput.getMonth();
    day = dateInput.getDate();
  }

  const dayStr = String(day).padStart(2, "0");
  const monthStr = THAI_SHORT_MONTHS[month] ?? "";
  const thaiYearShort = String((year + 543) % 100).padStart(2, "0");

  return `${dayStr} ${monthStr} ${thaiYearShort}`;
};

/**
 * Formats a date range into Thai short format: "06 ม.ค 69 - 12 ม.ค 69"
 */
export const formatThaiDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string => {
  if (!startDate && !endDate) return "";
  const formattedStart = formatThaiShortDate(startDate);
  const formattedEnd = formatThaiShortDate(endDate);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }
  return formattedStart || formattedEnd;
};
