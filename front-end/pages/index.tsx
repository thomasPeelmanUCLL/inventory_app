import React, { useState } from 'react';
import Head from 'next/head';
import Header from '@components/layout/Header';
import HomePageInformation from '@components/home/HomePageInformation';

const HomePage: React.FC = () => {
    const [language, setLanguage] = useState<'en' | 'es'>('en');

    return (
        <>
            <Head>
                <title>Inventory Management</title>
            </Head>
            <Header />
            <main>
                <div className="fixed top-20 right-4 z-10">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                        className="p-1 text-sm bg-blue-500 text-white rounded shadow"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                    </select>
                </div>
                <HomePageInformation language={language} />
            </main>
        </>
    );
};

export default HomePage;
