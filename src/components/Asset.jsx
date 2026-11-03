import React, { useEffect, useState } from 'react';
import { loadAsset, peekAsset } from './assetLoader.js';

/** The resolved asset for an id (null until it loads). */
export function useAsset(id) {
  const [result, setResult] = useState(() => peekAsset(id));
  useEffect(() => {
    let live = true;
    if (peekAsset(id)) setResult(peekAsset(id));
    else loadAsset(id).then((value) => live && setResult(value));
    return () => {
      live = false;
    };
  }, [id]);
  return result?.id === id ? result : peekAsset(id);
}

/** URL for an asset id: the real file, a borrowed one, or a placeholder data URL. */
export function useAssetUrl(id) {
  return useAsset(id)?.url || null;
}

/** An <img> for a registered asset; shows the labelled placeholder when the file is missing. */
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
