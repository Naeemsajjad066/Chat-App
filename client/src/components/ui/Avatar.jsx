import React from "react";
import assets from "../../assets/assets";

/**
 * Reusable avatar with optional online indicator dot.
 *
 * @param {string}  src      - Image URL
 * @param {string}  alt      - Alt text
 * @param {string}  size     - Tailwind size class, e.g. "w-10 h-10" (default "w-10 h-10")
 * @param {boolean} online   - Show green dot
 * @param {string}  dotSize  - Tailwind size for dot (default "w-3 h-3")
 */
const Avatar = React.memo(function Avatar({
  src,
  alt = "",
  size = "w-10 h-10",
  online = false,
  dotSize = "w-3 h-3",
  className = "",
}) {
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <img
        src={src || assets.avatar_icon}
        alt={alt}
        className={`${size} rounded-full object-cover`}
        loading="lazy"
        decoding="async"
      />
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${dotSize} bg-green-500
            rounded-full border-2 border-[#0f0e1a]`}
        />
      )}
    </div>
  );
});

export default Avatar;
