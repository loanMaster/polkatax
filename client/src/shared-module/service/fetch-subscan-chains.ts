export const fetchSubscanChains = async () => {
    const response = await fetch('/api/res/subscan-chains');
    if (!response.ok) {
        throw response;
    } 
    return (await response.json());
} 
