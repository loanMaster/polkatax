const bs58 = require("bs58");
const { getAddress, getBytes } = require("ethers");


function ethAddressToBytes(address) {
    // Entferne das Präfix "0x", falls vorhanden
    const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

    // Prüfe, ob die Adresse die richtige Länge hat
    if (cleanAddress.length !== 40) {
        throw new Error("Ungültige Ethereum-Adresse");
    }

    // Konvertiere die Hex-Zeichen in Bytes
    const bytes = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
        bytes[i] = parseInt(cleanAddress.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function createAccountId32(evmAddress) {
    // Normalize the address to its checksummed form
    const checksummedAddress = getAddress(evmAddress);
    console.log(checksummedAddress)
    // Convert the normalized address to a byte array
    const evmBytes = getBytes(checksummedAddress);

    // Überprüfen, ob die Adresse genau 20 Bytes hat
    console.log(evmBytes.length)
    if (evmBytes.length !== 20) {
        throw new Error("Ungültige Ethereum-Adresse");
    }

    // Erstelle ein Uint8Array mit 32 Bytes, initialisiert mit 0
    const data = new Uint8Array(32);

    // Kopiere die Zeichen "ETH\0" in die ersten 4 Bytes
    const prefix = Uint8Array.from([69, 84, 72, 0]); // "E", "T", "H", "\0"
    data.set(prefix, 0);

    // Kopiere die Ethereum-Adresse in die Bytes 4 bis 23
    data.set(evmBytes, 4);

    // Rückgabe: Das 32-Byte-Array
    return data;
}

const accountId32 = createAccountId32("0xd8C8f8E07F779C34aEc474bA1A04E20E792b5c5f");
const base58String = bs58.default.encode(accountId32);

console.log(base58String);