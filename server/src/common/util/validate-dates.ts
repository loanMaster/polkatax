import { HttpError } from "../error/HttpError";
import {formatDate} from "./format-date";

export const validateDates = (startDate: Date, endDate?: Date) => {
    if (startDate > (endDate || Date.now())) {
        throw new HttpError(400, "Start date after end date")
    }
    if (formatDate(endDate) < `${new Date().getFullYear() - 10}/12/31`) {
        throw new HttpError(400, "Start date invalid.")
    }
}
