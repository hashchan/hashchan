/**
 * Detects if the user is using the Brave browser
 * @returns Promise<boolean> True if the user is using Brave, false otherwise
 */
export const isBraveBrowser = async (): Promise<boolean> => {
  console.log(window.navigator)
  return ((window.navigator as any).brave && await (window.navigator as any).brave.isBrave()) || false;
}
