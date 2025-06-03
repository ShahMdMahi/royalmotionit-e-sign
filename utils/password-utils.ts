/**
 * Utility functions for password management
 */

/**
 * Generate a random password that meets our requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Optional special characters
 *
 * @param length The length of the password (default: 12)
 * @param includeSpecialChars Whether to include special characters (default: true)
 * @returns A random password string
 */
export function generatePassword(
  length: number = 12,
  includeSpecialChars: boolean = true,
): string {
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed confusing chars like I and O
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz"; // Removed confusing chars like l
  const numberChars = "23456789"; // Removed confusing chars like 0 and 1
  const specialChars = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  let allChars = uppercaseChars + lowercaseChars + numberChars;
  if (includeSpecialChars) {
    allChars += specialChars;
  }

  // Ensure minimum requirements
  let password = "";

  // Add one character from each required set
  password += uppercaseChars.charAt(
    Math.floor(Math.random() * uppercaseChars.length),
  );
  password += lowercaseChars.charAt(
    Math.floor(Math.random() * lowercaseChars.length),
  );
  password += numberChars.charAt(
    Math.floor(Math.random() * numberChars.length),
  );

  if (includeSpecialChars) {
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length),
    );
  }

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

/**
 * Shuffle a string randomly
 * @param str The string to shuffle
 * @returns The shuffled string
 */
function shuffleString(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}
