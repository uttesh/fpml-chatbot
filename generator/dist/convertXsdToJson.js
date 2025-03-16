"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fast_xml_parser_1 = require("fast-xml-parser");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ✅ Configuration Paths
const XSD_FOLDER = "confirmation"; // Folder containing all XSD files
const MAIN_XSD_FILE = path.join(XSD_FOLDER, "fpml-main-5-12.xsd");
const OUTPUT_JSON_FILE = "output/json/fpml-schema.json";
// ✅ Read and Parse an XSD File
const parseXsdFile = (filePath, processedFiles) => {
    if (processedFiles.has(filePath))
        return null;
    processedFiles.add(filePath);
    const xsdText = fs.readFileSync(filePath, "utf-8");
    const parser = new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ""
    });
    return parser.parse(xsdText);
};
// ✅ Extract Elements from Parsed XSD
const extractElements = (schema, xsdFolder, processedFiles) => {
    let elements = [];
    // 1️⃣ Handle <xs:import> to include other XSD files
    if (schema["xs:import"]) {
        const imports = Array.isArray(schema["xs:import"])
            ? schema["xs:import"]
            : [schema["xs:import"]];
        imports.forEach((imp) => {
            if (imp.schemaLocation) {
                const importedFilePath = path.join(xsdFolder, imp.schemaLocation);
                const importedSchema = parseXsdFile(importedFilePath, processedFiles);
                if (importedSchema) {
                    elements.push(...extractElements(importedSchema["xs:schema"], xsdFolder, processedFiles));
                }
            }
        });
    }
    // 2️⃣ Process Elements in Main XSD
    const schemaElements = schema["xs:element"] || [];
    (Array.isArray(schemaElements) ? schemaElements : [schemaElements]).forEach((el) => {
        var _a, _b, _c, _d, _e, _f;
        elements.push({
            name: el.name,
            type: el.type || "Unknown",
            mandatory: el.minOccurs !== "0",
            documentation: ((_b = (_a = el["xs:annotation"]) === null || _a === void 0 ? void 0 : _a["xs:documentation"]) === null || _b === void 0 ? void 0 : _b["#text"]) ||
                "No documentation available",
            attributes: (_d = (_c = el["xs:complexType"]) === null || _c === void 0 ? void 0 : _c["xs:attribute"]) === null || _d === void 0 ? void 0 : _d.reduce((acc, attr) => {
                acc[attr.name] = attr.type || "string";
                return acc;
            }, {}),
            children: ((_f = (_e = el["xs:complexType"]) === null || _e === void 0 ? void 0 : _e["xs:sequence"]) === null || _f === void 0 ? void 0 : _f["xs:element"])
                ? extractElements({
                    "xs:element": el["xs:complexType"]["xs:sequence"]["xs:element"]
                }, xsdFolder, processedFiles)
                : []
        });
    });
    return elements;
};
// 🚀 Main Function: Convert XSD to JSON
const convertXsdToJson = () => {
    try {
        const processedFiles = new Set();
        const parsedXsd = parseXsdFile(MAIN_XSD_FILE, processedFiles);
        if (!parsedXsd || !parsedXsd["xs:schema"]) {
            throw new Error("Invalid XSD structure");
        }
        const elements = extractElements(parsedXsd["xs:schema"], XSD_FOLDER, processedFiles);
        // ✅ Save JSON file
        fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(elements, null, 2));
        console.log(`✅ XSD converted successfully! JSON saved at: ${OUTPUT_JSON_FILE}`);
    }
    catch (error) {
        console.error("❌ Error converting XSD:", error.message);
    }
};
// 🔥 Run conversion
convertXsdToJson();
