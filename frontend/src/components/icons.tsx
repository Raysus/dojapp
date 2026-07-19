import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function BaseIcon({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </BaseIcon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.5-3.2 3.8-4.5 7-4.5s5.5 1.3 7 4.5" />
    </BaseIcon>
  );
}

export function IconDojo(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 4 7v4c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4Z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </BaseIcon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </BaseIcon>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3 12h2.2M18.8 12H21M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" />
    </BaseIcon>
  );
}

export function IconBrand(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 2 3 7v5c0 5.5 3.8 9.4 9 11 5.2-1.6 9-5.5 9-11V7l-9-5Z" />
      <path d="M8 13c1.5 2 3 3 4 3s2.5-1 4-3" />
    </BaseIcon>
  );
}
