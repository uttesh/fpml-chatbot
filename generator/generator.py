import os
import json
import xml.etree.ElementTree as ET

def parse_xsd_element(element, namespace="{http://www.w3.org/2001/XMLSchema}"):
    """ Recursively parses an XSD element into a dictionary format. """
    element_data = {
        "name": element.attrib.get("name", ""),
        "type": element.attrib.get("type", ""),
        "minOccurs": element.attrib.get("minOccurs", "1"),
        "maxOccurs": element.attrib.get("maxOccurs", "1"),
        "attributes": {},
        "children": []
    }

    # Extract documentation
    annotation = element.find(f"{namespace}annotation")
    if annotation is not None:
        doc = annotation.find(f"{namespace}documentation")
        if doc is not None:
            element_data["documentation"] = doc.text.strip() if doc.text else "No documentation available"

    # Extract attributes
    for attr in element.findall(f"{namespace}attribute"):
        attr_name = attr.attrib.get("name", "")
        element_data["attributes"][attr_name] = {
            "type": attr.attrib.get("type", ""),
            "use": attr.attrib.get("use", "optional")
        }

    # Extract child elements
    for child in element.findall(f"{namespace}element"):
        element_data["children"].append(parse_xsd_element(child, namespace))

    return element_data

def convert_xsd_to_json(xsd_file):
    """ Converts a single XSD file into JSON format. """
    try:
        tree = ET.parse(xsd_file)
        root = tree.getroot()
        namespace = "{http://www.w3.org/2001/XMLSchema}"

        xsd_data = {
            "file": os.path.basename(xsd_file),
            "rootElement": root.attrib.get("name", "Root"),
            "elements": []
        }

        for element in root.findall(f"{namespace}element"):
            xsd_data["elements"].append(parse_xsd_element(element, namespace))

        return xsd_data
    except Exception as e:
        print(f"❌ Error processing {xsd_file}: {e}")
        return None

def convert_all_xsd_in_directory(directory, output_json="all_xsd_data.json"):
    """ Scans a directory, processes all XSD files, and outputs a combined JSON file. """
    all_xsd_data = {}

    for filename in os.listdir(directory):
        if filename.endswith(".xsd"):
            xsd_path = os.path.join(directory, filename)
            print(f"🔄 Processing {filename}...")
            xsd_json = convert_xsd_to_json(xsd_path)
            if xsd_json:
                all_xsd_data[filename] = xsd_json

    # Save all XSD data into a single JSON file
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(all_xsd_data, f, indent=4)

    print(f"✅ All XSD files have been converted to '{output_json}'")

# Example usage
convert_all_xsd_in_directory("confirmation")
