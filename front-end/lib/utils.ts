import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getTokenAddress(tokenName: string) {
  switch (tokenName) {
    case "G$":
      return "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";
    case "USDT":
      return "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
  }
}