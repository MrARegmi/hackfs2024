// app/upload/layout.tsx
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
