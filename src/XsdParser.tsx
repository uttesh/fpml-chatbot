import React, { useState, useEffect } from "react";
import {
  TextField,
  Autocomplete,
  Typography,
  Container,
  Paper,
  CircularProgress
} from "@mui/material";
import { XMLParser } from "fast-xml-parser";

const LOCAL_XSD_PATH = "/xsd/confirmation/fpml-main-5-12.xsd";

interface XsdElement {
  name: string;
  type?: string;
  mandatory: boolean;
  documentation?: string;
}

const XsdParser: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elements, setElements] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elementDetails, setElementDetails] = useState<XsdElement | null>(null);

  useEffect(() => {
    loadXSD();
  }, []);

  const loadXSD = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(LOCAL_XSD_PATH);
      if (!response.ok) throw new Error("Failed to load local XSD file");

      const xsdText = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ""
      });
      const parsedXSD = parser.parse(xsdText);

      const schema = parsedXSD["xs:schema"];
      const elementList = schema["xs:element"];

      if (!elementList) throw new Error("No elements found in XSD");

      const elementNames = elementList.map((el: any) => el.name);
      setElements(elementNames);
    } catch (err) {
      setError("Error loading XSD file");
    } finally {
      setLoading(false);
    }
  };

  const getElementDetails = (name: string) => {
    setElementDetails(null);
    fetch(LOCAL_XSD_PATH)
      .then((response) => response.text())
      .then((xsdText) => {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: ""
        });
        const parsedXSD = parser.parse(xsdText);

        const schema = parsedXSD["xs:schema"];
        const elements = schema["xs:element"];

        const foundElement = elements.find((el: any) => el.name === name);
        if (!foundElement) return;

        const details: XsdElement = {
          name,
          type: foundElement.type || "Unknown",
          mandatory: foundElement.minOccurs !== "0",
          documentation:
            foundElement["xs:annotation"]?.["xs:documentation"]?.["#text"] ??
            "No documentation available"
        };

        setElementDetails(details);
      })
      .catch(() => setError("Error loading XSD details"));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          FPML XSD Element Selector
        </Typography>

        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && elements.length > 0 && (
          <Autocomplete
            options={elements}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select an Element"
                variant="outlined"
              />
            )}
            onChange={(_, value) => {
              setSelectedElement(value);
              if (value) getElementDetails(value);
            }}
            sx={{ mb: 3 }}
          />
        )}

        {elementDetails && (
          <Paper elevation={2} sx={{ mt: 3, p: 3, textAlign: "left" }}>
            <Typography variant="h6">Element Details:</Typography>
            <Typography>
              <strong>Name:</strong> {elementDetails.name}
            </Typography>
            <Typography>
              <strong>Type:</strong> {elementDetails.type}
            </Typography>
            <Typography>
              <strong>Mandatory:</strong>{" "}
              {elementDetails.mandatory ? "Yes" : "No"}
            </Typography>
            <Typography>
              <strong>Documentation:</strong> {elementDetails.documentation}
            </Typography>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default XsdParser;
