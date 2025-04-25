export const normalizeTokenName = (tokenName: string) => {
    tokenName = tokenName.toLowerCase()
    if (tokenName.startsWith('xc')) {
        return tokenName.substring(2)
    }
    return tokenName
}