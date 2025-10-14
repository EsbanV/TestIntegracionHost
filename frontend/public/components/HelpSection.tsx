import React from "react";
import FAQ from "./FAQ";
import ChatBox from "./ChatBox";

export default function HelpSection() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <FAQ />
      <ChatBox />
    </div>
  );
}

