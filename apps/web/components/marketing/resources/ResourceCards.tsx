"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownTrayIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { motion, useReducedMotion } from "framer-motion";
import type { Resource } from "./catalog";

const imageSources = {
  manufacturing: "/images/resources/manufacturing-operations.svg",
  saas: "/images/resources/saas-architecture.svg",
  ai: "/images/resources/ai-intelligence.svg",
  cloud: "/images/resources/cloud-architecture.svg",
  security: "/images/resources/security-blueprint.svg",
  update: "/images/resources/product-update.svg",
};

export function ResourceCover({ resource, priority = false }: { resource: Resource; priority?: boolean }) {
  return <div className={`resource-cover resource-cover-${resource.cover}`}>
    <Image src={imageSources[resource.cover]} alt="" fill priority={priority} sizes="(max-width: 700px) 100vw, (max-width: 950px) 50vw, 33vw" />
    <span className="resource-cover-glow" aria-hidden="true" />
    {resource.cover === "update" && <span className="resource-release-badge">v2.0</span>}
  </div>;
}

function ResourceMeta({ resource }: { resource: Resource }) {
  if (resource.author) return <span>{resource.author} <i /> {resource.date} <i /> {resource.readingTime}</span>;
  return <span>{resource.client ?? resource.meta}</span>;
}

export function ResourceCard({ resource, index = 0 }: { resource: Resource; index?: number }) {
  const reduceMotion = useReducedMotion();
  const action = resource.download ? <a href={resource.download} download className="resource-action">Download PDF <ArrowDownTrayIcon width={14} /></a> : <Link href={resource.href} className="resource-action">Explore resource <ArrowRightIcon width={14} /></Link>;

  return <motion.article className="resource-editorial-card" initial={reduceMotion ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: Math.min(index * .06, .24), duration: .45 }}>
    <ResourceCover resource={resource} />
    <div className="resource-card-body">
      <span className="resource-tag">{resource.type}</span>
      <h3>{resource.title}</h3>
      <p>{resource.description}</p>
      <div className="resource-card-footer"><ResourceMeta resource={resource} />{resource.outcome && <b>{resource.outcome}</b>}</div>
      {action}
    </div>
  </motion.article>;
}

export function ResourceCardGrid({ resources }: { resources: Resource[] }) {
  return <div className="resource-editorial-grid">{resources.map((resource, index) => <ResourceCard key={resource.slug} resource={resource} index={index} />)}</div>;
}
