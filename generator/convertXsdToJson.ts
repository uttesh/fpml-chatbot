import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";
import * as path from "path";

// ✅ Configuration Paths
const XSD_FOLDER = "confirmation"; // Folder containing all XSD files
const MAIN_XSD_FILE = path.join(XSD_FOLDER, "fpml-main-5-12.xsd");
const OUTPUT_JSON_FILE = "output/json/fpml-schema.json";

interface XsdElement {
  name: string;
  type?: string;
  mandatory: boolean;
  documentation?: string;
  attributes?: Record<string, string>;
  children?: XsdElement[];
}

// ✅ Read and Parse an XSD File
const parseXsdFile = (filePath: string, processedFiles: Set<string>): any => {
  if (processedFiles.has(filePath)) return null;
  processedFiles.add(filePath);

  const xsdText = fs.readFileSync(filePath, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ""
  });

  return parser.parse(xsdText);
};

// ✅ Extract Elements from Parsed XSD
const extractElements = (
  schema: any,
  xsdFolder: string,
  processedFiles: Set<string>
): XsdElement[] => {
  let elements: XsdElement[] = [];

  // 1️⃣ Handle <xs:import> to include other XSD files
  if (schema["xs:import"]) {
    const imports = Array.isArray(schema["xs:import"])
      ? schema["xs:import"]
      : [schema["xs:import"]];
    imports.forEach((imp: any) => {
      if (imp.schemaLocation) {
        const importedFilePath = path.join(xsdFolder, imp.schemaLocation);
        const importedSchema = parseXsdFile(importedFilePath, processedFiles);
        if (importedSchema) {
          elements.push(
            ...extractElements(
              importedSchema["xs:schema"],
              xsdFolder,
              processedFiles
            )
          );
        }
      }
    });
  }

  // 2️⃣ Process Elements in Main XSD
  const schemaElements = schema["xs:element"] || [];
  (Array.isArray(schemaElements) ? schemaElements : [schemaElements]).forEach(
    (el: any) => {
      elements.push({
        name: el.name,
        type: el.type || "Unknown",
        mandatory: el.minOccurs !== "0",
        documentation:
          el["xs:annotation"]?.["xs:documentation"]?.["#text"] ||
          "No documentation available",
        attributes: el["xs:complexType"]?.["xs:attribute"]?.reduce(
          (acc: any, attr: any) => {
            acc[attr.name] = attr.type || "string";
            return acc;
          },
          {}
        ),
        children: el["xs:complexType"]?.["xs:sequence"]?.["xs:element"]
          ? extractElements(
              {
                "xs:element": el["xs:complexType"]["xs:sequence"]["xs:element"]
              },
              xsdFolder,
              processedFiles
            )
          : []
      });
    }
  );

  return elements;
};

// 🚀 Main Function: Convert XSD to JSON
const convertXsdToJson = () => {
  try {
    const processedFiles = new Set<string>();
    const parsedXsd = parseXsdFile(MAIN_XSD_FILE, processedFiles);

    if (!parsedXsd || !parsedXsd["xs:schema"]) {
      throw new Error("Invalid XSD structure");
    }

    const elements = extractElements(
      parsedXsd["xs:schema"],
      XSD_FOLDER,
      processedFiles
    );

    // ✅ Save JSON file
    fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(elements, null, 2));
    console.log(
      `✅ XSD converted successfully! JSON saved at: ${OUTPUT_JSON_FILE}`
    );
  } catch (error: any) {
    console.error("❌ Error converting XSD:", error.message);
  }
};

// 🔥 Run conversion
convertXsdToJson();
