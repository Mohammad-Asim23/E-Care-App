import { Inter } from "next/font/google";
import "./global.css";
import Providers from "./Providers";
import {UserProvider,} from "../context/userContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Patient-Centeric-care",
  description: "Patient-Centeric-care is a platform that helps patients to find the best doctors and book appointments online.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <UserProvider>
            {children}
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}