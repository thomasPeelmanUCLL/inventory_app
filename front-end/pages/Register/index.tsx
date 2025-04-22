// pages/register.tsx
import Head from "next/head";
import Header from "@components/header";
import RegisterForm from "@components/RegisterForm"; // Note the capitalization

const RegisterPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Register</title>
      </Head>
      <main>
        <Header />
        <div className="flex flex-col items-center justify-start min-h-screen">
          <h1 className="text-[#1f0d38] mb-6 text-center font-bold mt-4">
            Register
          </h1>
          <div
            className="w-full max-w-md p-8 rounded-lg shadow-md mx-auto"
            style={{ background: "linear-gradient(10deg, #065290, #0a74da)" }}
          >
            <RegisterForm />
          </div>
        </div>
      </main>
    </>
  );
};

export default RegisterPage;
