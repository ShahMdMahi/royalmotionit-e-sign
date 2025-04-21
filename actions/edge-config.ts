"use server";

import { get } from "@vercel/edge-config";

const edgeConfigId = process.env.EDGE_CONFIG_ID;

export async function getIsRegistrationActive(): Promise<boolean> {
  try {
    const isRegistrationActive = await get("REGISTRATION_ACTIVE");
    if (isRegistrationActive === undefined) {
      console.error("REGISTRATION_ACTIVE is undefined in Edge Config");
      return false; // Default to false if the value is not found
    }

    if (typeof isRegistrationActive !== "boolean") {
      console.error("REGISTRATION_ACTIVE is not a boolean in Edge Config");
      return false; // Default to false if the value is not a boolean
    }
    return isRegistrationActive;
  } catch (error) {
    console.error("Error fetching registration status:", error);
    return false; // Return false in case of an error
  }
}

export async function updateIsRegistrationActive(status: boolean): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            operation: "update",
            key: "REGISTRATION_ACTIVE",
            value: status,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error updating registration status:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true, message: `Registration status updated successfully to ${status}` };
  } catch (error) {
    console.error("Error checking registration status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getIsGoogleAuthActive(): Promise<boolean> {
  try {
    const isGoogleAuthActive = await get("GOOGLE_AUTH_ACTIVE");
    if (isGoogleAuthActive === undefined) {
      console.error("GOOGLE_AUTH_ACTIVE is undefined in Edge Config");
      return false; // Default to false if the value is not found
    }

    if (typeof isGoogleAuthActive !== "boolean") {
      console.error("GOOGLE_AUTH_ACTIVE is not a boolean in Edge Config");
      return false; // Default to false if the value is not a boolean
    }
    return isGoogleAuthActive;
  } catch (error) {
    console.error("Error fetching Google Auth status:", error);
    return false; // Return false in case of an error
  }
}

export async function updateIsGoogleAuthActive(status: boolean): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            operation: "update",
            key: "GOOGLE_AUTH_ACTIVE",
            value: status,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error updating Google Auth status:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true, message: `Google Auth status updated successfully to ${status}` };
  } catch (error) {
    console.error("Error checking Google Auth status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getIsMaintenanceModeActive(): Promise<boolean> {
  try {
    const isMaintenanceModeActive = await get("MAINTENANCE_MODE_ACTIVE");
    if (isMaintenanceModeActive === undefined) {
      console.error("MAINTENANCE_MODE_ACTIVE is undefined in Edge Config");
      return false; // Default to false if the value is not found
    }

    if (typeof isMaintenanceModeActive !== "boolean") {
      console.error("MAINTENANCE_MODE_ACTIVE is not a boolean in Edge Config");
      return false; // Default to false if the value is not a boolean
    }
    return isMaintenanceModeActive;
  } catch (error) {
    console.error("Error fetching maintenance mode status:", error);
    return false; // Return false in case of an error
  }
}

export async function updateIsMaintenanceModeActive(status: boolean): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            operation: "update",
            key: "MAINTENANCE_MODE_ACTIVE",
            value: status,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error updating maintenance mode status:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true, message: `Maintenance mode status updated successfully to ${status}` };
  } catch (error) {
    console.error("Error checking maintenance mode status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
