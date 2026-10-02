"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { Resource } from "./catalog";

export function ResourceCover({ resource, priority = false }: { resource: Resource; priority?: boolean }) {
  return (
    <div className="resource-cover">
      <Image src={resource.image} alt={resource.imageAlt} fill priority={priority} sizes="(max-width: 700px) 100vw, (max-width: 950px) 50vw, 33vw" />
      <span className="resource-cover-glow" aria-hidden="true" />
    </div>
  );
}

function ResourceMeta({ resource }: { resource: Resource }) {
  return <span>{resource.type} · {resource.readingTime}</span>;
}

export function ResourceCard({ resource }: { resource: Resource; index?: number }) {
  return (
    <article className="resource-editorial-card">
      <ResourceCover resource={resource} />
      <div className="resource-card-body">
        <span className="resource-tag">{resource.type}</span>
        <h3>{resource.title}</h3>
        <p>{resource.description}</p>
        <div className="resource-card-footer">
          <ResourceMeta resource={resource} />
        </div>
        <Link href={resource.href} className="resource-action">
          Xem tài nguyên <ArrowRightIcon width={14} />
        </Link>
      </div>
    </article>
  );
}

export function ResourceCardGrid({ resources }: { resources: Resource[] }) {
  return <div className="resource-editorial-grid">{resources.map((resource, index) => <ResourceCard key={resource.slug} resource={resource} index={index} />)}</div>;
}
