export const mergeListElements = (list: any[]) => {
    let flattened = {};
    list.forEach(transfers => {
        flattened = {
            ...flattened,
            ...transfers
        }
    })
    return flattened
}
