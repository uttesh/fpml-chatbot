"use strict";
exports.__esModule = true;
var fast_xml_parser_1 = require("fast-xml-parser");
var fs = require("fs");
var path = require("path");
// ✅ Configuration Paths
var XSD_FOLDER = "confirmation"; // Folder containing all XSD files
var MAIN_XSD_FILE = path.join(XSD_FOLDER, "fpml-main-5-12.xsd");
var OUTPUT_JSON_FILE = "output/json/fpml-schema.json";
// ✅ Read and Parse an XSD File
var parseXsdFile = function (filePath, processedFiles) {
    if (processedFiles.has(filePath))
        return null;
    processedFiles.add(filePath);
    var xsdText = fs.readFileSync(filePath, "utf-8");
    var parser = new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ""
    });
    return parser.parse(xsdText);
};
// ✅ Extract Elements from Parsed XSD
var extractElements = function (schema, xsdFolder, processedFiles) {
    var elements = [];
    // 1️⃣ Handle <xs:import> to include other XSD files
    if (schema["xs:import"]) {
        var imports = Array.isArray(schema["xs:import"])
            ? schema["xs:import"]
            : [schema["xs:import"]];
        imports.forEach(function (imp) {
            if (imp.schemaLocation) {
                var importedFilePath = path.join(xsdFolder, imp.schemaLocation);
                var importedSchema = parseXsdFile(importedFilePath, processedFiles);
                if (importedSchema) {
                    elements.push.apply(elements, extractElements(importedSchema["xs:schema"], xsdFolder, processedFiles));
                }
            }
        });
    }
    // 2️⃣ Process Elements in Main XSD
    var schemaElements = schema["xs:element"] || [];
    (Array.isArray(schemaElements) ? schemaElements : [schemaElements]).forEach(function (el) {
        var _a, _b, _c, _d, _e, _f;
        elements.push({
            name: el.name,
            type: el.type || "Unknown",
            mandatory: el.minOccurs !== "0",
            documentation: ((_b = (_a = el["xs:annotation"]) === null || _a === void 0 ? void 0 : _a["xs:documentation"]) === null || _b === void 0 ? void 0 : _b["#text"]) ||
                "No documentation available",
            attributes: (_d = (_c = el["xs:complexType"]) === null || _c === void 0 ? void 0 : _c["xs:attribute"]) === null || _d === void 0 ? void 0 : _d.reduce(function (acc, attr) {
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
var convertXsdToJson = function () {
    try {
        var processedFiles = new Set();
        var parsedXsd = parseXsdFile(MAIN_XSD_FILE, processedFiles);
        if (!parsedXsd || !parsedXsd["xs:schema"]) {
            throw new Error("Invalid XSD structure");
        }
        var elements = extractElements(parsedXsd["xs:schema"], XSD_FOLDER, processedFiles);
        // ✅ Save JSON file
        fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(elements, null, 2));
        console.log("\u2705 XSD converted successfully! JSON saved at: " + OUTPUT_JSON_FILE);
    }
    catch (error) {
        console.error("❌ Error converting XSD:", error.message);
    }
};
// 🔥 Run conversion
convertXsdToJson();
