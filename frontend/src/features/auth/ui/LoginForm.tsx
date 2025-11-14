import React, { useState } from "react";
import Input from "../../../../public/components/Input";
import Button from "../../../../public/components/Button";

type Props = {
  onSubmit: (email: string, password: string) => void;
  loading?: boolean;
  className?: string;
};

export default function LoginForm({ onSubmit, loading = false, className = "" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className={`w-full max-w-md ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email.trim(), password);
      }}
      noValidate
      aria-live="polite"
    >
      <div className="mb-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tú@ejemplo.com"
          required
          autoComplete="email"
          className="h-11"
        />
      </div>

      <div className="mb-4">
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="h-11"
        />
      </div>

      <div>
        <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>
    </form>
  );
}
