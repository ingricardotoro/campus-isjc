import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Admisiones — Administración",
  robots: { index: false, follow: false },
};

const AdmisionesAdminRootLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdmisionesAdminRootLayout;
