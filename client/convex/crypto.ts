
// 
export async function hashString(data: string, salt: string = "veripy_global_salt"): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
// Generate a secure key
export function generateSecureKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return 'vp_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
  
