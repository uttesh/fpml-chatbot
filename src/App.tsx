import React from "react";
import { Container, Typography } from "@mui/material";
import Chatbot from "./Chatbot";
import XsdParser from "./XsdParser";

const App: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        FpML XSD Chatbot
      </Typography>
      <Chatbot />
      {/* <XsdParser /> */}
    </Container>
  );
};

export default App;
