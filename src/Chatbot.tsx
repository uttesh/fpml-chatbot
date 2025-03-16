import { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Autocomplete
} from "@mui/material";
import Fuse from "fuse.js";
import fpmlData from "./merged_xsd_attributes.json"; // Load JSON

interface Message {
  sender: "user" | "bot";
  text: string;
}

// Extract unique elements from JSON and retain full metadata
const xsdElements = fpmlData.map((item, index) => ({
  id: index,
  label: item.name || "Unknown Field",
  value: item.type || "Unknown Type",
  documentation: item.documentation || "No explanation available.",
  required: item.minOccurs !== "0",
  minOccurs: item.minOccurs || "0",
  maxOccurs: item.maxOccurs || "1"
}));

// Setup fuzzy search
const fuse = new Fuse(xsdElements, { keys: ["label"], threshold: 0.3 });

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !selectedElement) return;

    const userQuery = input || selectedElement || "";
    const userMessage: Message = { sender: "user", text: userQuery };
    setMessages((prev) => [...prev, userMessage]);

    // Perform fuzzy search
    const result = fuse.search(userQuery);
    const foundElement = result.length > 0 ? result[0].item : null;

    let responseText = foundElement
      ? `Field Name: ${foundElement.label}\n\n` +
        `Data Type: ${foundElement.value}\n\n` +
        `Required: ${
          foundElement.required
            ? "Yes, this field must be provided."
            : "No, this field is optional."
        }\n\n` +
        `Occurrences:\n- Minimum: ${foundElement.minOccurs}\n- Maximum: ${foundElement.maxOccurs}\n\n` +
        `Explanation:\n${foundElement.documentation}`
      : "Sorry, I couldn't find details for that field.";

    setMessages((prev) => [...prev, { sender: "bot", text: "" }]); // Placeholder for typing effect

    let index = 0;
    const typingInterval = setInterval(() => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          { sender: "bot", text: responseText.slice(0, index) }
        ];
      });

      index++;

      if (index > responseText.length) {
        clearInterval(typingInterval);
      }
    }, 15);

    setInput("");
    setSelectedElement(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "600px",
        height: "500px",
        padding: "16px"
      }}
    >
      <Typography
        variant="h6"
        sx={{ textAlign: "center", fontWeight: "bold", marginBottom: "8px" }}
      >
        FPML Chatbot
      </Typography>

      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          backgroundColor: "#f5f5f5"
        }}
      >
        {messages.map((message, index) => (
          <Paper
            key={index}
            sx={{
              padding: "10px",
              marginBottom: "8px",
              maxWidth: "80%",
              alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor:
                message.sender === "user" ? "#0078D7" : "#e0e0e0",
              color: message.sender === "user" ? "#fff" : "#000"
            }}
          >
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {message.text}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <Autocomplete
          options={xsdElements}
          getOptionLabel={(option) => option.label || ""}
          isOptionEqualToValue={(option, value) => option.label === value.label}
          onChange={(_, newValue) => {
            setSelectedElement(newValue ? newValue.label : null);
            setInput(newValue ? newValue.label : "");
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.label}>
              {option.label}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              placeholder="Search for an XSD element..."
              variant="outlined"
            />
          )}
          sx={{ width: "70%" }}
        />
        <Button variant="contained" color="primary" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbot;
