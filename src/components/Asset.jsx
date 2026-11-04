import React, { useEffect, useState } from 'react';
import { loadAsset, peekAsset } from './assetLoader.js';

/** The resolved asset for an id (null until it loads). */
export function useAsset(id) {
  const [result, setResult] = useState(() => peekAsset(id));
  // Placeholders repaint when the 'Show asset ids' setting changes.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const repaint = () => setVersion((value) => value + 1);
    window.addEventListener('gol:assets', repaint);
    return () => window.removeEventListener('gol:assets', repaint);
  }, []);
  useEffect(() => {
    let live = true;
    if (peekAsset(id)) setResult(peekAsset(id));
    else loadAsset(id).then((value) => live && setResult(value));
    return () => {
      live = false;
    };
  }, [id, version]);
  return result?.id === id ? result : peekAsset(id);
}

/** URL for an asset id: the real file, a borrowed one, or a placeholder data URL. */
export function useAssetUrl(id) {
  return useAsset(id)?.url || null;
}

/** An <img> for a registered asset; shows a placeholder (silhouette, shape or mood) when the file is missing. */
export default function Asset({ id, alt = '', className = '', ...rest }) {
  const result = useAsset(id);
  if (!result?.url) return <span className={`asset asset--loading ${className}`} data-asset={id} aria-hidden={alt ? undefined : true} />;
  return (
    <img
      className={`asset ${className}`}
      src={result.url}
      alt={alt}
      data-asset={id}
      data-placeholder={result.placeholder ? 'true' : undefined}
      draggable={false}
      {...rest}
    />
  );
}
