import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

export const formatDateWithLabel = (dateString: string) => {
  const date = dayjs(dateString);
  let label = "";

  if (date.isToday()) {
    label = "Today";
  } else if (date.isTomorrow()) {
    label = "Tomorrow";
  } else {
    label = dayjs().to(date);
  }

  return label;
};

export const getFormattedTime = (dateString: string) => {
  return dayjs(dateString).format("h:mma");
};

export const capitalizeWords = (text: string) => {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const numberWithCommas = (
  number: number | string | null | undefined,
  decimals?: number
): string => {
  if (number === null || number === undefined) return "NaN";

  const num = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(num)) return "NaN";

  const fixed = decimals !== undefined ? num.toFixed(decimals) : num.toString();
  const [integerPart, decimalPart] = fixed.split(".");

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart !== undefined
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};

export const removeCommas = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";

  const str = value.toString();

  return str.replace(/,/g, "");
};

export const formatDateToDDMMYY = (date?: dayjs.ConfigType): string => {
  if (!date) return "";
  return dayjs(date).format("DD/MM/YY");
};

export const formatDuration = (minutes: number | string | null | undefined): string => {
  if (minutes === null || minutes === undefined || isNaN(Number(minutes))) {
    return "";
  }

  const totalMinutes = Math.max(0, Math.floor(Number(minutes))); // Ensure non-negative, whole minutes
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const logError = (context: string, error: any) => {
  console.error(`${context} Error:`, {
    message: error.message,
    stack: error.stack,
    response: error.response?.data,
    code: error.code,
    timestamp: new Date().toISOString(),
  });
};

// Re-export map region service utilities
export {
  getMapRegionConfig,
  shouldUpdateMapRegion, STAGE_CONFIGS, updateMapRegion, type MapRegionConfiguration,
  type MapRegionParams
} from "./mapRegionService";

