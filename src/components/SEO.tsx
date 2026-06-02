/**
 * Componente SEO reutilizável para metadados por rota.
 * Define title, description, canonical e tags Open Graph
 * únicas para cada página, evitando metadados duplicados.
 */
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://ficha-paranormal.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.svg`;

interface SEOProps {
  /** Título da página (<60 caracteres recomendado) */
  title: string;
  /** Descrição da página (50–160 caracteres) */
  description: string;
  /** Caminho da rota (ex.: "/dashboard"). Usado para canonical e og:url */
  path: string;
  /** URL absoluta da imagem para Open Graph (opcional) */
  image?: string;
  /** Tipo de Open Graph (default: "website") */
  type?: "website" | "article";
}

export function SEO({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: SEOProps) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
