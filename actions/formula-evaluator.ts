// No "use server" directive since we're exporting non-async functions
import { DocumentField } from "@/types/document";

/**
 * Enhanced interface for conditional logic rule with compound conditions
 */
interface ConditionalLogic {
  condition: Condition;
  action: {
    type: string;
    value?: string;
  };
  targetFieldId: string;
  isVisible?: boolean; // Used for tracking visibility state
}

type Condition = SimpleCondition | CompoundCondition;

interface SimpleCondition {
  type: string;
  fieldId?: string;
  value?: string;
}

interface CompoundCondition {
  operator: "and" | "or";
  conditions: Condition[];
}

/**
 * Parse a conditional logic string
 * @param logicString JSON string containing conditional logic
 * @returns Parsed conditional logic or null if invalid
 */
export function parseConditionalLogic(
  logicString?: string,
): ConditionalLogic | null {
  if (!logicString) return null;

  try {
    const logic = JSON.parse(logicString);
    if (!logic.condition || !logic.action || !logic.targetFieldId) {
      return null;
    }
    return logic as ConditionalLogic;
  } catch (error) {
    console.error("Failed to parse conditional logic:", error);
    return null;
  }
}

/**
 * Evaluate a single condition against field values
 * @param condition The condition to evaluate
 * @param allFields All fields in the document
 * @returns Result of the condition evaluation
 */
function evaluateCondition(
  condition: Condition,
  allFields: DocumentField[],
): boolean {
  // Handle compound conditions
  if ("operator" in condition) {
    if (condition.operator === "and") {
      return condition.conditions.every((cond) =>
        evaluateCondition(cond, allFields),
      );
    } else if (condition.operator === "or") {
      return condition.conditions.some((cond) =>
        evaluateCondition(cond, allFields),
      );
    }
    return false;
  }

  // Handle simple conditions
  const simpleCondition = condition as SimpleCondition;
  if (!simpleCondition.fieldId) return true;

  const sourceField = allFields.find((f) => f.id === simpleCondition.fieldId);
  if (!sourceField || !sourceField.value) return false;

  const value = sourceField.value;
  const conditionValue = simpleCondition.value || "";

  switch (simpleCondition.type) {
    case "equals":
      return value === conditionValue;
    case "notEquals":
      return value !== conditionValue;
    case "contains":
      return value.includes(conditionValue);
    case "notContains":
      return !value.includes(conditionValue);
    case "greaterThan":
      return Number(value) > Number(conditionValue);
    case "lessThan":
      return Number(value) < Number(conditionValue);
    case "greaterThanOrEqual":
      return Number(value) >= Number(conditionValue);
    case "lessThanOrEqual":
      return Number(value) <= Number(conditionValue);
    case "isChecked":
      return value === "true" || value === "checked";
    case "isNotChecked":
      return value !== "true" && value !== "checked";
    case "isEmpty":
      // Handle null, undefined, and empty string values safely
      return !value || (typeof value === "string" && value.trim() === "");
    case "isNotEmpty":
      // Handle null, undefined, and empty string values safely
      return !!value && typeof value === "string" && value.trim() !== "";
    case "startsWith":
      return value.startsWith(conditionValue);
    case "endsWith":
      return value.endsWith(conditionValue);
    case "matchesRegex":
      try {
        const regex = new RegExp(conditionValue);
        return regex.test(value);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Check if a field should be visible based on conditional logic
 * @param field The field to check
 * @param allFields All fields in the document
 * @returns Whether the field should be visible
 */
export function isFieldVisible(
  field: DocumentField,
  allFields: DocumentField[],
): boolean {
  // Parse conditional logic
  const logic = parseConditionalLogic(field.conditionalLogic);

  // If no conditional logic or isVisible is explicitly true, field is visible
  if (!logic || logic.isVisible === true) return true;

  // If isVisible is explicitly false, field is hidden
  if (logic.isVisible === false) return false;

  // Otherwise, evaluate the condition
  return evaluateCondition(logic.condition, allFields);
}

/**
 * Evaluate a formula expression for a formula field
 * @param formula Formula expression to evaluate
 * @param allFields All fields in the document for variable substitution
 * @returns Computed value
 */
export function evaluateFormula(
  formula: string,
  allFields: DocumentField[],
): string {
  if (!formula) return "";

  try {
    // Check for special formula types
    if (formula.startsWith("IF(")) {
      return evaluateConditionalFormula(formula, allFields);
    }

    // Enhanced date function handling with better formatting
    if (formula.includes("TODAY()")) {
      const today = new Date();
      // Format the date properly for calculations
      const dateStr = `new Date(${today.getFullYear()}, ${today.getMonth()}, ${today.getDate()})`;
      formula = formula.replace(/TODAY\(\)/g, dateStr);
    }

    if (formula.includes("NOW()")) {
      formula = formula.replace(/NOW\(\)/g, `new Date()`);
    }

    // Add support for formatting dates with FORMAT_DATE()
    if (formula.includes("FORMAT_DATE(")) {
      const formatRegex = /FORMAT_DATE\(([^,]+),\s*['"]([^'"]+)['"]\)/g;
      formula = formula.replace(formatRegex, (match, dateExpr, format) => {
        // Return a function that will format the date after evaluation
        return `formatDate(${dateExpr}, "${format}")`;
      });
    }

    let processedFormula = formula;

    // Replace field references with actual values
    const fieldRefs = formula.match(/\${([^}]+)}/g) || [];
    for (const ref of fieldRefs) {
      const fieldId = ref.substring(2, ref.length - 1);
      const field = allFields.find((f) => f.id === fieldId);
      if (field && field.value) {
        // For numeric operations, ensure we're using a number
        let value = field.value;

        // Handle date values specially
        if (field.type === "date" && !isNaN(new Date(value).getTime())) {
          value = `new Date("${value}")`;
        } else if (!isNaN(Number(value))) {
          value = Number(value).toString();
        } else {
          // For non-numeric values, wrap in quotes for string operations
          value = `"${value}"`;
        }
        processedFormula = processedFormula.replace(ref, value);
      } else {
        // Handle replacements based on expected type
        if (
          formula.includes(`parseInt(${ref})`) ||
          formula.includes(`parseFloat(${ref})`)
        ) {
          processedFormula = processedFormula.replace(ref, "0");
        } else if (
          formula.includes(`${ref}.toUpperCase()`) ||
          formula.includes(`${ref}.toLowerCase()`)
        ) {
          processedFormula = processedFormula.replace(ref, '""');
        } else {
          // Default replacement
          processedFormula = processedFormula.replace(ref, "0");
        }
      }
    }

    // Add utility functions that might be used in formulas
    const utilityFunctions = `
      function formatDate(date) {
        if (!date || !(date instanceof Date)) return '';
        return date.toISOString().split('T')[0];
      }
      function round(number, decimals = 0) {
        return Number(Math.round(Number(number + 'e' + decimals)) + 'e-' + decimals);
      }
      function sum(...args) {
        return args.reduce((sum, val) => sum + (Number(val) || 0), 0);
      }
      function avg(...args) {
        const validArgs = args.filter(val => !isNaN(Number(val)));
        return validArgs.length ? sum(...validArgs) / validArgs.length : 0;
      }
    `;

    // Safely evaluate the formula
    try {
      // Evaluate formula using Function constructor with utility functions
      const result = new Function(`
        ${utilityFunctions}
        return ${processedFormula};
      `)();

      // Format result based on type
      if (result instanceof Date) {
        return result.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      }

      return result !== undefined ? result.toString() : "";
    } catch (error) {
      console.error("Error evaluating formula:", error, processedFormula);
      return "Error";
    }
  } catch (error) {
    console.error("Error processing formula:", error);
    return "Error";
  }
}

/**
 * Evaluate a conditional IF formula
 * @param formula IF formula to evaluate
 * @param allFields All fields in the document
 * @returns Result of the IF formula
 */
function evaluateConditionalFormula(
  formula: string,
  allFields: DocumentField[],
): string {
  try {
    // Extract condition and branches from IF(condition, trueValue, falseValue)
    const match = formula.match(
      /IF\s*\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)/i,
    );
    if (!match) return "Error: Invalid IF formula";

    const [_, condition, trueValue, falseValue] = match;

    // Replace field references in the condition
    const processedCondition = evaluateFormula(condition, allFields);

    // Evaluate the condition
    let conditionResult: boolean;
    try {
      // For conditions that aren't already booleans, evaluate them
      if (processedCondition === "true") {
        conditionResult = true;
      } else if (processedCondition === "false") {
        conditionResult = false;
      } else {
        conditionResult = Boolean(
          new Function(`return ${processedCondition}`)(),
        );
      }
    } catch {
      conditionResult = false;
    }

    // Return the appropriate branch result
    return evaluateFormula(conditionResult ? trueValue : falseValue, allFields);
  } catch (error) {
    console.error("Error evaluating conditional formula:", error);
    return "Error";
  }
}
