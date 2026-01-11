"use client";

import clsx from "clsx";
import Image from "next/image";
import Label from "../label";
import { useState, useEffect } from "react";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  orientation = 'square',
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  orientation?: 'square' | 'landscape' | 'portrait' | string;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
} & React.ComponentProps<typeof Image>) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(props.src);

  // Update imgSrc when props.src changes
  useEffect(() => {
    setImgSrc(props.src);
    setImgError(false);
  }, [props.src]);

  const handleError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E`);
    }
  };

  // Normalize orientation (handle both uppercase from DB and lowercase)
  const normalizedOrientation = typeof orientation === 'string' 
    ? orientation.toLowerCase() as 'square' | 'landscape' | 'portrait'
    : (orientation || 'square');

  // Determine aspect ratio based on orientation
  const aspectRatioClass = {
    square: 'aspect-square',
    landscape: 'aspect-[4/3]',
    portrait: 'aspect-[3/4]',
  }[normalizedOrientation] || 'aspect-square';

  return (
    <div
      className={clsx(
        "group relative flex w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-neutral-900",
        aspectRatioClass,
        {
          "border-2 border-blue-600": active,
          "border-neutral-200 dark:border-neutral-800": !active,
        },
      )}
    >
      {imgSrc && imgSrc.toString().trim() !== "" ? (
        <Image
          className={clsx("object-cover", {
            "transition duration-300 ease-in-out group-hover:scale-105":
              isInteractive,
          })}
          {...props}
          src={imgSrc}
          onError={handleError}
        />
      ) : (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <span className="text-neutral-400 dark:text-neutral-600">No Image</span>
        </div>
      )}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
