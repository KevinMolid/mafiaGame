import React from "react";
import H4 from "./Typography/H4";

type CardProps = {
  /** Width & height utility classes, e.g. "w-60 h-80" */
  size?: string;
  /** Extra classes for the outer card */
  className?: string;

  /** Optional header image */
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;

  /** Simple body API (use children for full control) */
  title?: React.ReactNode;
  description?: React.ReactNode;

  /** Custom body content (renders after title/description) */
  children?: React.ReactNode;

  /** Footer content (e.g., <Button />). Sticks to bottom. */
  footer?: React.ReactNode;

  /** Class hooks */
  bodyClassName?: string;
  footerClassName?: string;
};

const Card: React.FC<CardProps> = ({
  size = "w-60 h-80",
  className = "",
  imageSrc,
  imageAlt = "",
  imageClassName = "h-36 w-full object-cover border-b border-neutral-700",
  title,
  description,
  children,
  footer,
  bodyClassName = "p-4",
  footerClassName = "h-[90px] flex items-center justify-center bg-neutral-900/50",
}) => {
  return (
    <div
      className={`${size} bg-neutral-800 rounded-xl flex flex-col overflow-hidden ${className}`}
    >
      {imageSrc && (
        <img src={imageSrc} alt={imageAlt} className={imageClassName} />
      )}

      {(title || description || children) && (
        <div className={bodyClassName}>
          {title && <H4>{title}</H4>}
          {description && <small>{description}</small>}
          {children}
        </div>
      )}

      {footer && (
        <div className={`mt-auto rounded-b-xl ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
