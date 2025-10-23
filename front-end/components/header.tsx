import Link from "next/link";
import { useSession, signOut } from "../lib/auth-client";
import { useRouter } from "next/router";
import { useState } from "react";

const Header: React.FC = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/Login');
  };

  return (
      <header className="bg-gradient-to-r from-[#065290] to-[#0a74da] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Container */}
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link
                href="/"
                className="text-2xl font-bold text-white hover:text-blue-100 transition-colors flex items-center gap-2"
            >
              <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Inventory Management
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                  href="/"
                  className={`text-white hover:text-blue-100 transition-colors font-medium ${
                      router.pathname === "/" ? "border-b-2 border-white pb-1" : ""
                  }`}
              >
                Home
              </Link>
              {session && (
                  <Link
                      href="/Inventory"
                      className={`text-white hover:text-blue-100 transition-colors font-medium ${
                          router.pathname === "/Inventory" ? "border-b-2 border-white pb-1" : ""
                      }`}
                  >
                    Inventory
                  </Link>
              )}
            </nav>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center gap-4">
              {isPending ? (
                  <div className="flex items-center gap-2 text-white">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                      />
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-sm">Loading...</span>
                  </div>
              ) : session ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                        {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">
                    {session.user.name || session.user.email}
                  </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                      Logout
                    </button>
                  </>
              ) : (
                  <>
                    <Link
                        href="/Login"
                        className="px-4 py-2 text-white border border-white/30 hover:bg-white/10 font-medium rounded-lg transition-all"
                    >
                      Login
                    </Link>
                    <Link
                        href="/Register"
                        className="px-4 py-2 bg-white text-[#065290] hover:bg-blue-50 font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                      Register
                    </Link>
                  </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                ) : (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/20">
                <nav className="flex flex-col gap-2 mb-4">
                  <Link
                      href="/"
                      className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  {session && (
                      <Link
                          href="/Inventory"
                          className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                      >
                        Inventory
                      </Link>
                  )}
                </nav>

                {/* Mobile User Actions */}
                <div className="flex flex-col gap-2 px-4">
                  {isPending ? (
                      <div className="text-white text-sm">Loading...</div>
                  ) : session ? (
                      <>
                        <div className="flex items-center gap-2 text-white mb-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">
                      {session.user.name || session.user.email}
                    </span>
                        </div>
                        <button
                            onClick={() => {
                              handleLogout();
                              setMobileMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Logout
                        </button>
                      </>
                  ) : (
                      <>
                        <Link
                            href="/Login"
                            className="w-full px-4 py-2 text-center text-white border border-white/30 hover:bg-white/10 font-medium rounded-lg transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                            href="/Register"
                            className="w-full px-4 py-2 text-center bg-white text-[#065290] hover:bg-blue-50 font-medium rounded-lg transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </>
                  )}
                </div>
              </div>
          )}
        </div>
      </header>
  );
};

export default Header;
