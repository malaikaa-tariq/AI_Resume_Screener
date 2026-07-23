type IconName =
  | "home"
  | "sparkles"
  | "upload"
  | "file"
  | "user"
  | "history"
  | "template"
  | "edit"
  | "download"
  | "trash"
  | "login"
  | "logout"
  | "menu"
  | "close"
  | "mail"
  | "phone"
  | "location"
  | "link"
  | "check"
  | "palette"
  | "arrow"
  | "save"
  | "image"
  | "camera"
  | "chevronDown"
  | "eye";

const paths: Record<IconName, string[]> = {
  home: ["M3 11.5 12 4l9 7.5", "M5 10v10h14V10", "M9 20v-6h6v6"],
  sparkles: ["m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z", "m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z", "m5 14 1 2.7L9 18l-3 1.3L5 22l-1-2.7L1 18l3-1.3L5 14Z"],
  upload: ["M12 16V4", "m7 9 5-5 5 5", "M5 20h14"],
  file: ["M6 3h8l4 4v14H6z", "M14 3v5h5"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
  history: ["M3 12a9 9 0 1 0 3-6.7", "M3 4v5h5", "M12 7v5l3 2"],
  template: ["M4 3h16v18H4z", "M8 7h8", "M8 11h8", "M8 15h5"],
  edit: ["m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z", "m13.5 6.5 3.5 3.5"],
  download: ["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M7 7l1 14h8l1-14"],
  login: ["M10 17l5-5-5-5", "M15 12H3", "M14 3h7v18h-7"],
  logout: ["m14 17 5-5-5-5", "M19 12H7", "M10 3H3v18h7"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  close: ["M5 5l14 14", "M19 5 5 19"],
  mail: ["M3 5h18v14H3z", "m3 7 9 6 9-6"],
  phone: ["M6 3h4l2 5-3 2a16 16 0 0 0 5 5l2-3 5 2v4c0 2-2 3-4 3C9 20 4 15 3 7c0-2 1-4 3-4Z"],
  location: ["M12 22s7-6.1 7-13a7 7 0 1 0-14 0c0 6.9 7 13 7 13Z", "M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"],
  link: ["M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2", "M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2"],
  check: ["m5 12 4 4L19 6"],
  palette: ["M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4c0-3-4-6-9-6Z", "M7 10h.01", "M9 6h.01", "M15 6h.01", "M17 10h.01"],
  arrow: ["M5 12h14", "m14 7 5 5-5 5"],
  save: ["M5 4h12l2 2v14H5z", "M8 4v6h8V4", "M8 20v-6h8v6"],
  image: ["M4 4h16v16H4z", "m4 16 5-5 4 4 2-2 5 5", "M15 8h.01"],
  camera: ["M5 7h3l1.5-2h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z", "M12 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"],
  chevronDown: ["m6 9 6 6 6-6"],
  eye: ["M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
};

export default function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
