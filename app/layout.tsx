"use client";
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Navbar } from "@/components/navbar"
import { Inter } from "next/font/google"
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from "react"

const inter = Inter({ subsets: ["latin"] })

import { useEffect, useState } from "react";

function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <>{children}</>;
}

export default function Layout({ children }: { children: ReactNode }) {  return (<html lang="en" data-render-id="initial"><body className={cn("flex min-h-svh flex-col antialiased", inter.className)}><ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><ClientOnly><Navbar /></ClientOnly><TooltipProvider delayDuration={0}><ClientOnly>{children}</ClientOnly></TooltipProvider></ThemeProvider></body></html>);
}
import './globals.css'