import React from "react";

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="bg-surface p-lg rounded-md shadow-xl m-md max-w-xl w-full">
      <h2 className="text-lg font-bold mb-sm text-primary">{title}</h2>
      <div className="text-secondary">{children}</div>
    </div>
  );
}