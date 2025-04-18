"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme: resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme || 'system';

  useEffect(() => {
    setMounted(true)
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-background border-b border-border h-16 flex items-center justify-end px-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />} 
      </Button>
    </nav>
  );
}