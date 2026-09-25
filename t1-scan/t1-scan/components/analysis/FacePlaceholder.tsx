export function FacePlaceholder({ src }: { src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="Analyzed face" className="absolute inset-0 h-full w-full object-cover" />;
  }

  // Simple silhouette placeholder so the layout renders correctly without a
  // real uploaded photo. Swap this for a real <img> or next/image once a
  // photo is available.
  return (
  <div className="absolute inset-0 flex items-center justify-center -translate-x-[10px]">
    <svg
      width="46%"
      height="46%"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="50" cy="38" r="22" fill="#C9BFF2" opacity="0.7" />
      <path
        d="M14 100c0-22 16-38 36-38s36 16 36 38"
        fill="#C9BFF2"
        opacity="0.7"
      />
    </svg>
  </div>
);
}
