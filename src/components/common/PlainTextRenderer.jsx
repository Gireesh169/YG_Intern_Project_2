import React from "react";

const PlainTextRenderer = ({ text }) => {
  if (!text) return null;

  return (
    <pre
      className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-lg border"
      style={{ lineHeight: "1.6" }}
    >
      {text}
    </pre>
  );
};

export default PlainTextRenderer;
