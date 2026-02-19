interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return <main className="relative z-10 min-h-screen">{children}</main>;
}
