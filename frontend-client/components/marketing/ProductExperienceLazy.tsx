"use client";

import dynamic from "next/dynamic";

const ProductExperience = dynamic(
  () => import("@/components/marketing/ProductExperience"),
  {
    ssr: false,
    loading: ProductExperienceSkeleton,
  },
);

function ProductExperienceSkeleton() {
  return (
    <div className="experience-shell experience-skeleton" role="status" aria-label="Đang tải trải nghiệm sản phẩm">
      <div className="experience-tabs" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => <span className="experience-skeleton-tab" key={item} />)}
      </div>
      <div className="experience-stage" aria-hidden="true">
        <div className="experience-layout">
          <div className="experience-card experience-skeleton-card" />
          <div className="experience-side">
            <div className="experience-card experience-skeleton-card" />
            <div className="experience-card experience-skeleton-card experience-skeleton-card-small" />
          </div>
        </div>
      </div>
      <span className="sr-only">Đang tải trải nghiệm sản phẩm</span>
    </div>
  );
}

export default function ProductExperienceLazy() {
  return <ProductExperience />;
}
