import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  email: string;
  role: string;
}

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user data from sessionStorage on mount
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    // Clear session storage and update state
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <header
      className="p-4 mb-3 border-bottom relative"
      style={{ background: "linear-gradient(90deg, #065290, #0a74da)" }}
    >
      {/* Header Title */}
      <div className="flex justify-between items-center">
        <a
          className="fs-2 fw-bold text-white text-decoration-none"
          style={{ fontSize: "1.5rem" }}
        >
          Setup Showcase
        </a>

        {/* Top Right User Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-4">
          {user ? (
            <>
              <span className="fs-6 text-white">{user.email}</span>
              <button
                onClick={handleLogout}
                className="fs-5 text-white bg-red-600 hover:bg-red-700 rounded px-4 py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/Login"
                className="fs-5 text-white bg-[#005d8c] hover:bg-[#063970] rounded px-4 py-2"
              >
                Login
              </Link>
              <Link
                href="/Register"
                className="fs-5 text-white bg-[#005d8c] hover:bg-[#063970] rounded px-4 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex justify-center gap-6 mt-3">
        <Link
          href="/"
          className="nav-link fs-5 text-white hover:underline"
        >
          HomePage
        </Link>
        <Link
          href="/SetupOverview"
          className="nav-link fs-5 text-white hover:underline"
        >
          SetupOverview
        </Link>
        <Link
          href="/CreateNewSetup"
          className="nav-link fs-5 text-white hover:underline"
        >
          CreateNewSetup
        </Link>
        <Link
          href="/EditYourSetupPage"
          className="nav-link fs-5 text-white hover:underline"
        >
          EditYourSetup
        </Link>
      </nav>
    </header>
  );
};

export default Header;





