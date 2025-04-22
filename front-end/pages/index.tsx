import React, { useState } from 'react';
import Head from 'next/head';
import Header from '@components/header';
import HomePageInformation from '@components/HomePageInformation';

const HomePage: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as 'en' | 'es');
  };

  return (
    <>
      <Head>
        <title>HomePage</title>
      </Head>
      <Header />
      <main className="d-flex flex-column justify-content-center align-items-center">
        <div className="fixed top-20 right-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="p-1 text-sm bg-blue-500 text-white rounded shadow"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        <section>
          <HomePageInformation language={language} />
        </section>
      </main>
    </>
  );
};

export default HomePage;

// HomePageInformation component remains unchanged


