export const processFunctionName = (functionName: string) => {
    return functionName ? functionName.replace(/\(.*\)/g, '') : functionName
}
