import fetch from "node-fetch";
import { HttpError } from "../error/HttpError";

export class RequestHelper {
  defaultHeader = {};

  async req(url, method, body?): Promise<any> {
    const response = await this.handleError(
      fetch(url, {
        method: method,
        headers: this.defaultHeader,
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
    return response.json();
  }

  async handleError(fetchRequest: Promise<any>) {
    const response = await fetchRequest;
    if (!response.ok) {
      throw new HttpError(response.status, await response.text(), response.url);
    }
    return response;
  }
}
