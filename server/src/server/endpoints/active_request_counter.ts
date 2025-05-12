const MAX_REQ = 1;
let req = 0;

export const activeRequestCounter = {
  increase: () => {
    if (req < MAX_REQ) {
      req++;
      return true;
    }
    return false;
  },
  decrease: () => req--,
};
