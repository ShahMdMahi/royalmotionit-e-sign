"use server";

export type FieldProperties = {
  id: string;
  // Add other properties as needed based on your field structure
  [key: string]: any;
};

export async function handleFieldPropertiesUpdate(properties: FieldProperties) {
  // Server action wrapper for onUpdate
  return properties;
}

export async function handleFieldPropertiesClose() {
  // Server action wrapper for onClose
  return true;
}
