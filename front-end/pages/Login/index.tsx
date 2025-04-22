import Head from "next/head";
import Header from "@components/header";
import LoginForm from "@components/loginform";

const RegisterPage: React.FC = () => {
  const exampleUsers = [
    { email: "linda.lawson@ucll.be", password: "lindas123", role: "admin" },
    { email: "john.doe@example.com", password: "john123", role: "user" },
    { email: "max.mustermann@example.com", password: "max123", role: "user" },
    { email: "guestuser@example.com", password: "guest123", role: "guest" },
  ];

  return (
    <>
      <Head>
        <title>login</title>
      </Head>
      <main>
        <Header />
        <div className="flex flex-col items-center justify-start min-h-screen">
          <h1 className="text-[#1f0d38] mb-6 text-center font-bold mt-4">
            login
          </h1>
          <div
            className="w-full max-w-md p-8 rounded-lg shadow-md mx-auto"
            style={{ background: "linear-gradient(10deg, #065290, #0a74da)" }}
          >
            <LoginForm />
          </div>

          {/* Example User Data Grid */}
          <div className="mt-8 w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4 text-center">Example Users</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Email</th>
                  <th className="border border-gray-300 px-4 py-2">Password</th>
                  <th className="border border-gray-300 px-4 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {exampleUsers.map((user, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.password}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;

