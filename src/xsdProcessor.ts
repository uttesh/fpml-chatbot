import { XMLParser } from "fast-xml-parser";

const FpML_XSD_URL =
  "https://www.fpml.org/spec/fpml-5-12-3-rec-1/xsd/fpml-main-5-12.xsd";

interface AttributeDetails {
  name: string;
  type: string;
  use: string;
  defaultValue?: string;
}

interface FieldDetails {
  name: string;
  type: string;
  mandatory: boolean;
  documentation?: string;
  attributes: AttributeDetails[];
  sampleResponse: string;
}

class XSDProcessor {
  private schema: any = null;
  private elementList: string[] = [];

  async loadFpMLXSD() {
    try {
      const response = await fetch(FpML_XSD_URL);
      const xsdString = await response.text();
      this.loadXSD(xsdString);
    } catch (error) {
      console.error("Error fetching FpML XSD:", error);
    }
  }



  loadXSD(xsdString: string) {
    const parser = new XMLParser({ ignoreAttributes: false });
    this.schema = parser.parse(xsdString);
    this.elementList = this.extractElementNames();
  }

  getElementList(): string[] {
    return this.elementList;
  }

  private extractElementNames(): string[] {
    const schemaElements = this.schema?.["xs:schema"]?.["xs:element"] || [];
    return schemaElements.map((el: any) => el["@_name"]);
  }

  getFieldDetails(elementName: string): FieldDetails | null {
    if (!this.schema) return null;

    const schemaElements = this.schema?.["xs:schema"]?.["xs:element"] || [];
    const foundElement = schemaElements.find(
      (el: any) => el["@_name"] === elementName
    );

    if (!foundElement) return null;

    const isMandatory = foundElement["@_minOccurs"] !== "0";
    const type = foundElement["@_type"] || "string";
    const documentation =
      foundElement["xs:annotation"]?.["xs:documentation"]?.["_"] ??
      "No documentation available.";
    const attributes = this.extractAttributes(foundElement);

    const sampleResponse = this.generateSampleResponse(elementName, attributes);

    return {
      name: elementName,
      type,
      mandatory: isMandatory,
      documentation,
      attributes,
      sampleResponse
    };
  }

  private extractAttributes(element: any): AttributeDetails[] {
    const attributes = element["xs:complexType"]?.["xs:attribute"] || [];
    return attributes.map((attr: any) => ({
      name: attr["@_name"],
      type: attr["@_type"] || "string",
      use: attr["@_use"] || "optional",
      defaultValue: attr["@_default"]
    }));
  }

  private generateSampleResponse(
    elementName: string,
    attributes: AttributeDetails[]
  ): string {
    const attrs = attributes.map((attr) => `${attr.name}="sample"`).join(" ");
    return `<${elementName} ${attrs}>Sample Value</${elementName}>`;
  }
}

export const xsdProcessor = new XSDProcessor();
