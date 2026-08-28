"use client";
import dynamic from "next/dynamic";

const ProductExperience = dynamic(() => import("@/components/marketing/ProductExperience"), { ssr: false });

export default function ProductExperienceLazy() {
  return <ProductExperience />;
}
