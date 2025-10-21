import React from "react";
import FAQ from "./components/FAQ";
import ChatBox from "./components/ChatBox";
import { Sidebar } from "./components/Sidebar";
import Header from '../../shared/ui/Header'

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-transparent grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="border-r">
        <Sidebar active="ayuda" />
      </aside>

      <div className="min-w-0">
        <Header />
        <main className="p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <FAQ />
            <ChatBox />
          </div>
        </main>
      </div>
    </div>
  );
}

